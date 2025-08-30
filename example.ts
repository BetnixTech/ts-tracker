import { EnterpriseGadgetTracker } from './EnterpriseGadgetTracker';

const tracker = new EnterpriseGadgetTracker();
tracker.addGadget('MacBook Pro', 'Apple', 2499);
tracker.addGadget('Surface Pro 9', 'Microsoft', 1599);
tracker.updateGadget(tracker.listGadgets()[0].id, { price: 2399 });
console.log('All gadgets:', tracker.listGadgets());
console.log('History:', tracker.getHistory());

const secret = 'my-super-secret-key';
const encrypted = tracker.exportEncrypted(secret);

// Later or elsewhere...
const tracker2 = new EnterpriseGadgetTracker();
tracker2.importEncrypted(encrypted, secret);
console.log('Imported gadgets:', tracker2.listGadgets());
