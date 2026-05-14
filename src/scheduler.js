const cron = require("node-cron");
const { runSync } = require("./sync");
const syncState = { running:false, startedAt:null, finishedAt:null, total:0, processed:0, updated:0, errors:0, message:"Sistema pronto" };
function getSyncState(){ return syncState; }
function updateSyncState(patch){ Object.assign(syncState, patch); }
function startScheduler(){
  const schedule = process.env.SYNC_CRON || "0 1 * * *";
  cron.schedule(schedule, () => runSync({manual:false}).catch(console.error));
  console.log(`Sync automatica programmata: ${schedule}`);
}
module.exports = { startScheduler, getSyncState, updateSyncState };
