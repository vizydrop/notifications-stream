const errors = require(`@vizydrop/errors`);

const defaultProcessError = (error) => Promise.resolve(error);

module.exports = (
    stream,
    processResult,
    processError = defaultProcessError,
) => (sourceEmitter) => {
    let notificationStarted = false;
    let rowNotificationStarted = false;
    stream.write(`{"notifications":{`);
    const closeNotificationBlock = () => {
        if (notificationStarted) {
            return `]},`;
        }
        return `},`;
    };

    const writeErrorResponse = (error) => {
        stream.write(
            `${closeNotificationBlock()}"error":${JSON.stringify(
                errors.convertForStringify(error),
            )}}`,
        );
        stream.end();
    };

    const sendError = (error) => {
        Promise.resolve(processError(error))
            .then(writeErrorResponse)
            .catch(writeErrorResponse);
    };

    sourceEmitter.on(`totalRecords`, (count) => {
        stream.write(`"totalRecords":"${count}", "inserted":[`);
        notificationStarted = true;
    });
    sourceEmitter.on(`error`, sendError);
    sourceEmitter.on(`inserted`, (count) => {
        if (rowNotificationStarted) {
            stream.write(`, ${count}`);
        } else {
            rowNotificationStarted = true;
            stream.write(`${count}`);
        }
    });
    sourceEmitter.on(`result`, (sourceInfo) => {
        Promise.resolve(processResult(sourceInfo))
            .then((result) => {
                stream.write(
                    `${closeNotificationBlock()}"result":${JSON.stringify(
                        result,
                    )}}`,
                );
                stream.end();
            })
            .catch(sendError);
    });
};
