import assert from 'node:assert/strict';
import { normalizeCheckoutItems, validateCheckoutCustomer } from './src/commerce/validation.js';

const validCustomer = {
  name: 'Ada Lovelace',
  email: 'ADA@example.com',
  phone: '+91 99999 99999',
  shippingAddress: {
    line1: '123 Craft Lane',
    line2: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400050',
    country: 'IN',
  },
};

const customer = validateCheckoutCustomer(validCustomer);
assert.equal(customer.ok, true);
if (customer.ok) assert.equal(customer.value.email, 'ada@example.com');

assert.equal(validateCheckoutCustomer({ ...validCustomer, email: 'not-an-email' }).ok, false);
assert.equal(validateCheckoutCustomer({ ...validCustomer, name: ' '.repeat(121) }).ok, false);
assert.equal(validateCheckoutCustomer({
  ...validCustomer,
  shippingAddress: { line1: '', city: 'Mumbai' },
}).ok, false);

const oneLine = normalizeCheckoutItems([{ productId: 'product-1', quantity: 2 }]);
assert.equal(oneLine.ok, true);
if (oneLine.ok) {
  assert.deepEqual(oneLine.value, [{ product_id: 'product-1', quantity: 2 }]);
}

assert.equal(normalizeCheckoutItems([{ productId: 'product-1', quantity: 1.5 }]).ok, false);
assert.equal(normalizeCheckoutItems([{ productId: 'product-1', quantity: 0 }]).ok, false);
assert.equal(normalizeCheckoutItems([{ productId: 'product-1', quantity: -1 }]).ok, false);
assert.equal(normalizeCheckoutItems([{ productId: 'product-1', quantity: '2' }]).ok, false);
assert.equal(normalizeCheckoutItems([{ productId: 'product-1', quantity: 21 }]).ok, false);
assert.equal(normalizeCheckoutItems([
  { productId: 'product-1', quantity: 12 },
  { productId: 'product-1', quantity: 9 },
]).ok, false);
assert.equal(normalizeCheckoutItems(Array.from({ length: 31 }, (_, index) => ({
  productId: `product-${index}`,
  quantity: 1,
}))).ok, false);

const collapsed = normalizeCheckoutItems([
  { productId: 'product-1', quantity: 2 },
  { productId: 'product-2', quantity: 1 },
  { productId: 'product-1', quantity: 3 },
]);
assert.equal(collapsed.ok, true);
if (collapsed.ok) {
  assert.deepEqual(collapsed.value, [
    { product_id: 'product-1', quantity: 5 },
    { product_id: 'product-2', quantity: 1 },
  ]);
}

console.log('All commerce validation tests passed.');
