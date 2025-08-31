
// Change to the correct working directory
process.chdir('/app');

const { handleGetHolisticUpdateStatus } = require('/app/dist/tools/holistic-context-updates.js');

async function execute() {
    try {
        const config = {
  "limitCount": 1
};
        console.log('⏱️  Starting handleGetHolisticUpdateStatus with config:', JSON.stringify(config, null, 2));
        const result = await handleGetHolisticUpdateStatus(config);
        console.log('✅ Operation completed successfully');
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('❌ Container execution error:', error.message);
        if (error.stack) console.error(error.stack);
        process.exit(1);
    }
}

execute();
