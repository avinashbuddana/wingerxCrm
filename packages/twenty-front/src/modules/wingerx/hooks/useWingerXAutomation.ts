import { useCallback, useRef, useState } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useCreateManyRecords } from '@/object-record/hooks/useCreateManyRecords';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useObjectMorphJunctionConfigOrThrow } from '@/object-record/record-field/ui/hooks/useObjectMorphJunctionConfigOrThrow';
import { findTargetFieldInfo } from '@/object-record/record-field/ui/utils/junction/findTargetFieldInfo';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { type WingerXRecord } from '@/wingerx/utils/wingerxRecordUtils';

export type WingerXAutomationCandidate = {
  objectNameSingular: string;
  record: WingerXRecord;
};

export type WingerXAutomationRule = {
  key: string;
  title: string;
  taskPrefix: string;
  description: string;
  candidates: WingerXAutomationCandidate[];
  dueInHours: number;
};

export type WingerXAutomationRunResult = {
  created: number;
  skipped: number;
  failed: number;
};

const getRecordName = (record: WingerXRecord) => {
  for (const key of ['name', 'title', 'subject', 'companyName']) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) return value;
    if (value && typeof value === 'object') {
      const objectValue = value as Record<string, unknown>;
      const label = objectValue.name ?? objectValue.label ?? objectValue.title;
      if (typeof label === 'string' && label.trim().length > 0) return label;
    }
  }

  return 'Untitled record';
};

const getAssigneeId = (record: WingerXRecord) => {
  for (const key of [
    'owner',
    'assignee',
    'assignedTo',
    'salesperson',
    'accountExecutive',
    'workspaceMember',
  ]) {
    const value = record[key];
    if (value && typeof value === 'object' && 'id' in value) {
      const id = (value as { id?: unknown }).id;
      if (typeof id === 'string') return id;
    }
  }

  return undefined;
};

const getTaskMarker = (ruleKey: string, recordId: string) =>
  `[WX-${ruleKey}-${recordId.slice(0, 8)}]`;

export const useWingerXAutomation = ({
  taskRecords,
}: {
  taskRecords: WingerXRecord[];
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunAt, setLastRunAt] = useState<Date | null>(null);
  const createdMarkersRef = useRef(new Set<string>());
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);

  const { objectMetadataItems } = useObjectMetadataItems();
  const taskJunctionConfig = useObjectMorphJunctionConfigOrThrow({
    objectNameSingular: CoreObjectNameSingular.Task,
  });
  const { createOneRecord: createTask } = useCreateOneRecord({
    objectNameSingular: CoreObjectNameSingular.Task,
    shouldMatchRootQueryFilter: true,
  });
  const { createManyRecords: createTaskTargets } = useCreateManyRecords({
    objectNameSingular: taskJunctionConfig.junctionObjectMetadata.nameSingular,
    shouldMatchRootQueryFilter: true,
  });

  const existingTaskTitles = new Set(
    taskRecords.flatMap((task) =>
      typeof task.title === 'string' ? [task.title] : [],
    ),
  );

  const runRule = useCallback(
    async (
      rule: WingerXAutomationRule,
    ): Promise<WingerXAutomationRunResult> => {
      if (isRunning) return { created: 0, skipped: 0, failed: 0 };

      setIsRunning(true);
      const result: WingerXAutomationRunResult = {
        created: 0,
        skipped: 0,
        failed: 0,
      };

      try {
        for (const candidate of rule.candidates) {
          const marker = getTaskMarker(rule.key, candidate.record.id);
          const alreadyExists =
            createdMarkersRef.current.has(marker) ||
            [...existingTaskTitles].some((title) => title.includes(marker));

          if (alreadyExists) {
            result.skipped += 1;
            continue;
          }

          try {
            const dueAt = new Date(
              Date.now() + rule.dueInHours * 60 * 60 * 1000,
            ).toISOString();
            const recordName = getRecordName(candidate.record);
            const task = await createTask({
              title: `${marker} ${rule.taskPrefix}: ${recordName}`,
              status: 'TODO',
              dueAt,
              assigneeId:
                getAssigneeId(candidate.record) ?? currentWorkspaceMember?.id,
              bodyV2: {
                blocknote: null,
                markdown: `${rule.description}\n\nSource: ${candidate.objectNameSingular} — ${recordName}`,
              },
            });

            const targetObjectMetadata = objectMetadataItems.find(
              (item) => item.nameSingular === candidate.objectNameSingular,
            );
            const targetFieldInfo = findTargetFieldInfo(
              taskJunctionConfig.junctionObjectMetadata.fields,
              targetObjectMetadata?.id ?? '',
              objectMetadataItems,
            );

            if (isDefined(targetFieldInfo?.joinColumnName)) {
              await createTaskTargets({
                recordsToCreate: [
                  {
                    [taskJunctionConfig.sourceJoinColumnName]: task.id,
                    [targetFieldInfo.joinColumnName]: candidate.record.id,
                  },
                ],
                upsert: true,
              });
            }

            createdMarkersRef.current.add(marker);
            result.created += 1;
          } catch {
            result.failed += 1;
          }
        }
      } finally {
        setIsRunning(false);
        setLastRunAt(new Date());
      }

      return result;
    },
    [
      createTask,
      createTaskTargets,
      existingTaskTitles,
      isRunning,
      objectMetadataItems,
      currentWorkspaceMember?.id,
      taskJunctionConfig.junctionObjectMetadata.fields,
      taskJunctionConfig.sourceJoinColumnName,
    ],
  );

  const runRules = useCallback(
    async (rules: WingerXAutomationRule[]) => {
      const total: WingerXAutomationRunResult = {
        created: 0,
        skipped: 0,
        failed: 0,
      };

      for (const rule of rules) {
        const result = await runRule(rule);
        total.created += result.created;
        total.skipped += result.skipped;
        total.failed += result.failed;
      }

      return total;
    },
    [runRule],
  );

  return { isRunning, lastRunAt, runRule, runRules };
};
