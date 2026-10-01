import assert from "node:assert/strict";
import test from "node:test";
import { calculateBackoffDelay } from "@/services/familysearch/client";

test("calculateBackoffDelay increases delay with retry count and stays within bounds", () => {
  const delay0 = calculateBackoffDelay(0, 1000, 10000);
  assert.ok(delay0 >= 1000 && delay0 <= 1500, `Delay 0 within bounds: ${delay0}`);

  const delay1 = calculateBackoffDelay(1, 1000, 10000);
  assert.ok(delay1 >= 2000 && delay1 <= 2500, `Delay 1 within bounds: ${delay1}`);

  const delay2 = calculateBackoffDelay(2, 1000, 10000);
  assert.ok(delay2 >= 4000 && delay2 <= 4500, `Delay 2 within bounds: ${delay2}`);

  const delayMax = calculateBackoffDelay(5, 1000, 5000);
  assert.ok(delayMax <= 5500, `Max delay respected with jitter: ${delayMax}`);
});
