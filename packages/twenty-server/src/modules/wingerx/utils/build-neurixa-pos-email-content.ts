import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const DEMO_URL = 'https://calendly.com/abhi-neurixasolutions/30min';
const LOGO = 'WingerX_Logo.png';
const DEMO_CARD = 'WingerX_Restaurant_POS_Demo_Card.jpg';
const OVERVIEW_PDF = 'WingerX_Restaurant_POS_Overview.pdf';
const LOGO_ID = 'wingerx-logo@neurixasolutions.com';
const DEMO_CARD_ID = 'wingerx-pos-demo-card@neurixasolutions.com';

export const escapeWingerXEmailMessage = (message: string) =>
  message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br />');

export const buildNeurixaPosEmailContent = async (
  text: string,
  escapedMessage: string,
  {
    assets = join(
      process.cwd(),
      'dist',
      'assets',
      'modules',
      'wingerx',
      'assets',
    ),
    unsubscribeUrl,
  }: { assets?: string; unsubscribeUrl?: string } = {},
) => {
  const [logo, demoCard, overview] = await Promise.all([
    readFile(join(assets, LOGO), 'base64'),
    readFile(join(assets, DEMO_CARD), 'base64'),
    readFile(join(assets, OVERVIEW_PDF), 'base64'),
  ]);
  const paragraphs = escapedMessage
    .split(/(?:<br \/>){2,}/)
    .map((paragraph) => `<p style="margin:0 0 16px">${paragraph}</p>`)
    .join('');

  return {
    text: `${text}\n\nBook a 30-minute demo: ${DEMO_URL}${unsubscribeUrl ? `\n\nUnsubscribe: ${unsubscribeUrl}` : ''}`,
    html: `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#edf2f8" style="width:100%;background:#edf2f8;font-family:Arial,sans-serif">
        <tr><td align="center" style="padding:20px 10px">
          <!--[if mso]><table role="presentation" width="580" cellspacing="0" cellpadding="0"><tr><td><![endif]-->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="width:100%;max-width:580px;background:#ffffff;color:#101d35;border:1px solid #dce5f1">
            <tr><td style="padding:15px 24px">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%">
                <tr>
                  <td valign="middle">
                    <img src="cid:${LOGO_ID}" width="152" style="display:block;width:152px;max-width:100%;height:auto;border:0;font-size:17px;font-weight:bold;color:#10274e" alt="WingerX">
                  </td>
                  <td align="right" valign="middle" style="padding-left:8px;font-size:12px;line-height:18px;font-weight:bold;color:#10274e">Restaurant POS</td>
                </tr>
              </table>
            </td></tr>
            <tr><td bgcolor="#10274e" style="background:#10274e;color:#ffffff;border-top:4px solid #1a75f0;padding:26px 24px 28px">
              <h1 style="margin:0 0 20px;max-width:400px;font-size:32px;line-height:38px;font-weight:bold;color:#ffffff">Could WingerX work at your outlet?</h1>
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr><td bgcolor="#ffffff" style="background:#ffffff;border-radius:5px">
                  <a href="${DEMO_URL}" style="display:inline-block;border:12px solid #ffffff;padding:0 5px;border-radius:5px;font-size:15px;line-height:20px;color:#064db4;text-decoration:none;font-weight:bold">Book a 30-minute demo</a>
                </td></tr>
              </table>
            </td></tr>
            <tr><td style="padding:24px 24px 0;font-size:15px;line-height:23px">
              ${paragraphs}
            </td></tr>
            <tr><td style="padding:4px 24px 24px">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border:1px solid #dce5f1">
                <tr><td bgcolor="#eef5ff" style="padding:8px 12px;background:#eef5ff;font-size:13px;line-height:19px;font-weight:bold;color:#10274e">Attached PDF · WingerX POS overview</td></tr>
                <tr><td>
                  <a href="${DEMO_URL}" aria-label="Book a 30-minute WingerX POS demo">
                    <img src="cid:${DEMO_CARD_ID}" width="530" style="display:block;width:100%;max-width:530px;height:auto;border:0;font-size:14px;color:#10274e" alt="WingerX POS demo card">
                  </a>
                </td></tr>
              </table>
            </td></tr>
            ${unsubscribeUrl ? `<tr><td style="padding:0 24px 20px;font-size:13px;color:#10274e"><a href="${escapeWingerXEmailMessage(unsubscribeUrl)}" style="color:#10274e">Unsubscribe from POS outreach</a></td></tr>` : ''}
          </table>
          <!--[if mso]></td></tr></table><![endif]-->
        </td></tr>
      </table>`,
    attachments: [
      {
        filename: LOGO,
        content: logo,
        encoding: 'base64',
        contentType: 'image/png',
        cid: LOGO_ID,
      },
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
