import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const DEMO_URL = 'https://calendly.com/abhi-neurixasolutions/30min';
const DEMO_CARD = 'WingerX_Restaurant_POS_Demo_Card.jpg';
const OVERVIEW_PDF = 'WingerX_Restaurant_POS_Overview.pdf';
const DEMO_CARD_ID = 'wingerx-pos-demo-card@neurixasolutions.com';

export const buildNeurixaPosEmailContent = async (
  text: string,
  escapedMessage: string,
) => {
  const assets = join(
    process.cwd(),
    'dist',
    'assets',
    'modules',
    'wingerx',
    'assets',
  );
  const [demoCard, overview] = await Promise.all([
    readFile(join(assets, DEMO_CARD), 'base64'),
    readFile(join(assets, OVERVIEW_PDF), 'base64'),
  ]);

  return {
    text: `${text}\n\nBook a 30-minute demo: ${DEMO_URL}`,
    html: `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef5ff;font-family:Arial,sans-serif">
        <tr><td align="center" style="padding:16px 8px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;color:#101d35">
            <tr><td style="background:#10274e;color:#ffffff;padding:20px 24px">
              <strong style="font-size:23px">WingerX</strong><br>
              <span style="font-size:14px;color:#cde1ff">by Neurixa Solutions</span>
            </td></tr>
            <tr><td style="padding:24px;font-size:16px;line-height:1.55">
              ${escapedMessage}
              <p style="margin:24px 0 0">
                <a href="${DEMO_URL}" style="display:inline-block;background:#0754c6;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold">Book a 30-minute demo</a>
              </p>
            </td></tr>
            <tr><td style="padding:0 24px 24px">
              <a href="${DEMO_URL}">
                <img src="cid:${DEMO_CARD_ID}" width="512" style="display:block;width:100%;max-width:512px;height:auto;border:0" alt="Evaluate WingerX POS with your own menu">
              </a>
            </td></tr>
          </table>
        </td></tr>
      </table>`,
    attachments: [
      {
        filename: DEMO_CARD,
        content: demoCard,
        encoding: 'base64',
        contentType: 'image/jpeg',
        cid: DEMO_CARD_ID,
      },
      {
        filename: OVERVIEW_PDF,
        content: overview,
        encoding: 'base64',
        contentType: 'application/pdf',
      },
    ],
  };
};
