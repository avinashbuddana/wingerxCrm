import { useMemo } from 'react';

import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type RecordGqlOperationGqlRecordFields } from 'twenty-shared/types';

import {
  normalizeWingerXKey,
  type WingerXRecord,
} from '@/wingerx/utils/wingerxRecordUtils';

export type WingerXObjectCandidate = {
  names: string[];
  labels?: string[];
};

export const useWingerXObjectRecords = ({
  candidate,
  fields,
  fallbackObjectName = 'person',
  limit = 500,
}: {
  candidate: WingerXObjectCandidate;
  fields: string[];
  fallbackObjectName?: string;
  limit?: number;
}) => {
  const { objectMetadataItems } = useObjectMetadataItems();

  const objectMetadataItem = useMemo(() => {
    const normalizedNames = candidate.names.map(normalizeWingerXKey);
    const normalizedLabels = (candidate.labels ?? []).map(normalizeWingerXKey);

    return objectMetadataItems.find((item) => {
      const itemNames = [item.nameSingular, item.namePlural].map(
        normalizeWingerXKey,
      );
      const itemLabels = [item.labelSingular, item.labelPlural].map(
        normalizeWingerXKey,
      );

      return (
        itemNames.some((value) => normalizedNames.includes(value)) ||
        itemLabels.some((value) => normalizedLabels.includes(value))
      );
    });
  }, [candidate.labels, candidate.names, objectMetadataItems]);

  const readableFieldNames = useMemo(() => {
    if (!objectMetadataItem) return [];

    const requestedFields = new Set(['id', ...fields]);
    return objectMetadataItem.readableFields
      .filter((field) => field.isActive && requestedFields.has(field.name))
      .map((field) => field.name);
  }, [fields, objectMetadataItem]);

  const recordGqlFields = useMemo<RecordGqlOperationGqlRecordFields>(
    () =>
      Object.fromEntries(
        readableFieldNames.map((fieldName) => [fieldName, true]),
      ),
    [readableFieldNames],
  );

  const result = useFindManyRecords<WingerXRecord>({
    objectNameSingular: objectMetadataItem?.nameSingular ?? fallbackObjectName,
    recordGqlFields,
    limit,
    skip: !objectMetadataItem,
    fetchPolicy: 'cache-and-network',
  });

  return {
    ...result,
    matchedObjectMetadataItem: objectMetadataItem,
    readableFieldNames,
    isDetected: Boolean(objectMetadataItem),
  };
};
