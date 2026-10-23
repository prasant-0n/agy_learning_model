# Lab 5.1: The AI TDD Loop & Concurrency Bug Resolution

## Objective
Experience the strict TDD workflow for fixing subtle asynchronous defects in Node.js backend code.

## The Bug Pattern: Async Inside `Array.prototype.forEach`
One of the most widespread AI-generated bugs in Node.js is calling `async` callbacks inside `.forEach()`:
```javascript
// ANTIPATTERN: forEach does not await promises!
items.forEach(async (item) => {
  await database.update(item);
});
return { success: true };
```

### Consequences:
1. The caller receives `{ success: true }` immediately while operations are still running in the background.
2. Any errors thrown inside the async callback trigger uncaught `unhandledRejection` events that can crash the Node.js process.

## The Verification Workflow
1. **Red Phase**: [`test/batch-inventory.test.mjs`](file:///home/prasanta/Documents/agy_learning_model/labs/05-debugging-tdd-code-review/test/batch-inventory.test.mjs) proved that `deductedCount` returned 0 and expected rejections were missed.
2. **Green Phase**: [`src/batch-inventory.service.js`](file:///home/prasanta/Documents/agy_learning_model/labs/05-debugging-tdd-code-review/src/batch-inventory.service.js) refactored into a two-phase check-and-commit loop.
3. **Validation**:
```bash
node --test labs/05-debugging-tdd-code-review/test/batch-inventory.test.mjs
```
