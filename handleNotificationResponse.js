const oboe = require(`oboe`);
const EventEmitter = require(`events`);

module.exports = function(processResult) {
    return (sourceStream) => {
        const emitter = new EventEmitter();
        let isFinished = false;
        sourceStream.on(`error`, (error) => {
            emitter.emit(`error`, error);
        });
        oboe(sourceStream)
            .node(`!notifications.totalRecords`, (data) => {
                emitter.emit(`totalRecords`, data);
            })
            .node(`!notifications.inserted.*`, (data) => {
                emitter.emit(`inserted`, data);
            })
            .node(`!result`, async (data) => {
                isFinished = true;
                const res = await processResult(data);
                emitter.emit(`result`, res);
            })
            .node(`!error`, (data) => {
                isFinished = true;
                emitter.emit(`error`, data);
            })
            .done(() => {
                if (isFinished === false) {
                    emitter.emit(
                        `error`,
                        new Error(
                            `Response from source store is not completed`,
                        ),
                    );
                }
            });
        return emitter;
    };
};
