const NEURIXA_POS_DEMO_URL =
  'https://calendly.com/abhi-neurixasolutions/30min';

export const buildNeurixaPosEmail = (recipientName?: string) => {
  const name = recipientName?.replace(/\s+/g, ' ').trim();
  const subject = name ? `A quick POS demo for ${name}` : 'A quick POS demo';

  return {
    subject: subject.slice(0, 200),
    message: [
      name ? `Hi ${name},` : 'Hi there,',
      'I’m Abhi from Neurixa Solutions. We’re building WingerX POS to help restaurants manage billing, orders, and daily sales in one place.',
      'In a 30-minute demo, I can walk you through how it would work for your outlet, show you how you can access your restaurant data, and discuss pricing.',
      `Book a 30-minute demo here: ${NEURIXA_POS_DEMO_URL}\nYou can also reply here if you’d like to ask a question first.`,
      'Thanks,\nAbhi\nWingerX by Neurixa Solutions\nabhi@neurixasolutions.com',
    ].join('\n\n'),
  };
};
