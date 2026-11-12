export const buildNeurixaPosEmail = (recipientName?: string) => {
  const name = recipientName?.replace(/\s+/g, ' ').trim();

  return {
    subject: 'One order from your menu, from kitchen to bill',
    message: [
      name ? `Hi ${name},` : 'Hi there,',
      'I’m Abhi from Neurixa Solutions. In a WingerX POS demo, we’ll use items from your menu to take an order, send it to the kitchen, close the bill, and find the sale in your daily report.',
      'Already using a POS? We can review a sample export, show you what can move, and discuss a trial at one outlet. You’ll get a clear breakdown of setup, ongoing support, and any hardware or integrations you choose.',
      'I’ve attached a one-page overview. If you’d like to see it live, reply DEMO and I’ll send you a couple of times.',
      'Thanks,\nAbhi\nWingerX by Neurixa Solutions\nabhi@neurixasolutions.com',
    ].join('\n\n'),
  };
};
