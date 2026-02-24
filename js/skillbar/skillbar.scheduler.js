// GW-accurate Skillbar Scheduler (activation-held)

export function createScheduler({
    aftercastMs = 750,
    maxQueue = 1
} = {}) {

    let queue = [];
    let casting = false;

    function enqueue(slot, skill) {
        if (queue.find(q => q.slot === slot)) return;

        // queue full → evict last
        if (queue.length >= maxQueue) {
            const evicted = queue.pop();
            evicted.slot.cancel();
        }

        queue.push({ slot, skill });

        // activation animation starts immediately and HOLDS
        slot.beginActivation();

        if (!casting) processQueue();
    }

    async function processQueue() {
        casting = true;

        while (queue.length) {
            const { slot, skill } = queue.shift();

            // wait until this skill is allowed to cast
            await wait(skill.activation * 1000);

            // finish activation (flash etc.)
            slot.finishActivation();

            // start recharge (parallel, not awaited)
            slot.playRecharge(skill.recharge * 1000);

            // aftercast delay before next activation finishes
            await wait(aftercastMs);
        }

        casting = false;
    }

    function clear() {
        queue.forEach(q => q.slot.cancel());
        queue = [];
        casting = false;
    }

    return {
        enqueue,
        clear,
        getQueue: () => queue.map(q => q.slot)
    };
}

function wait(ms) {
    return new Promise(r => setTimeout(r, ms));
}
