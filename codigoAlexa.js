const Alexa = require('ask-sdk-core');
const AWS = require('aws-sdk');
const IotData = new AWS.IotData({ endpoint: 'aqpw3xfp04sdt-ats.iot.us-east-1.amazonaws.com' });

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        console.log(handlerInput.requestEnvelope.session.user);
        const speakOutput = 'Bienvenido al Internet de las Cosas, puedes pedir ayuda!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const GirarServo = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GirarServoIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Enviando datos al gato distancia test';
        const params = {
            topic: 'gato_distancia_test',
            payload: JSON.stringify({
                state: {
                    desired: {
                        result: 'dispensed'
                    }
                }
            }),
            qos: 0
        };

        IotData.publish(params, (err, data) => {
            if (err) {
                console.error('Error al publicar en el tópico:', err);
                speakOutput = 'Lo siento, no pude abrir el Internet de las Cosas';
            } else {
                console.log('Mensaje publicado exitosamente:', data);
            }
        });

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};



const EscucharESPIntent = (message) => 
{
    // Procesa el mensaje recibido aquí
    const messageBody = JSON.parse(message);
    const result = messageBody.state.desired.result;

    if (result === 'dispensed') {
        // Si el resultado es 'dispensed', envía una respuesta al usuario
        const speakOutput = 'El servomotor está girando por el objeto inteligente';
        // Aquí podrías también enviar una notificación al usuario utilizando el SDK de Alexa

        return speakOutput;
    }
};

exports.handler = async (event) => {
    // Manejar la recepción de mensajes MQTT desde IoT Core
    const message = event.payload.toString('utf8');
    const response = EscucharESPIntent(message);

    if (response) {
        // Si hay una respuesta, enviarla al usuario
        return {
            statusCode: 200,
            body: response
        };
    } else {
        // Si no hay respuesta, simplemente terminar la ejecución de la función
        return {
            statusCode: 200,
            body: 'Mensaje procesado'
        };
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Adiós!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Sorry, I don\'t know about that. Please try again.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)});
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};

const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = You just triggered ${intentName};

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(~~~~ Error handled: ${JSON.stringify(error)});

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// Resto de tus handlers y configuración de la skill...

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        GirarServo,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler
        // Otros handlers aquí...
    )
    .addErrorHandlers(
        ErrorHandler
    )
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();
