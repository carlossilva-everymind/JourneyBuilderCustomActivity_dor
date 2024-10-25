const { v1: Uuidv1 } = require('uuid');
const JWT = require('../utils/jwtDecoder');
const SFClient = require('../utils/sfmc-client');
const logger = require('../utils/logger');
const axios = require('axios');
const moment = require('moment-timezone');
const InfoLogger = require("../utils/infoLogger");


/*
  Arquivo de configuração das rotas do backend da atividade customizada
*/

/**
 * The Journey Builder calls this method for each contact processed by the journey.
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
exports.execute = async (req, res) => {
  // decode data
  // logger = new InfoLogger('activity.js');
  // logger.log.info(`Request body`, req.body);
  console.log("Iniciando Execute");
  const data = JWT(req.body);
  console.log('Execute - Dados decodificados: ', data)
  // logger.info(data);

  const dataReceived = JSON.stringify(data, null, 0);
  // console.log('dataReceived', dataReceived);

  const {
    idAgendamento,
    StatusAgendamento,
    dataExtensionID,
    confirmacaoText,
    confirmacaoBoolean,
    status,
    saveDate,
    dataExtensionKeyFields,
    dataExtensionKeyFieldsValues,
    DEExternalKey
  } = data.inArguments[0];

  let sfmcToken;

  const arrDataExtensionKeyFields = dataExtensionKeyFields.split(';');
  const arrDataExtensionKeyFieldsValues = dataExtensionKeyFieldsValues.split(';');
  let DEkeys = {};
  for (let i = 0; i < arrDataExtensionKeyFields.length; i++) {
    DEkeys[arrDataExtensionKeyFields[i]] = arrDataExtensionKeyFieldsValues[i]
  }
  console.log('DEkeys', DEkeys);
  console.log('DEExternalKey', DEExternalKey);
  logger.error(`Testando o logger`);

  const timeZone = 'America/Sao_Paulo'; // Specify the desired time zone
  const now = moment().tz(timeZone);
  console.log(now.format('YYYY-MM-DD HH:mm:ss')); // Output the formatted date and time

  try {
    const id = Uuidv1();

    let authToken;

    // chamada para token do motion
    const headers = {
      "client_id": process.env.MOTION_CLIENT_ID,
      "client_secret": process.env.MOTION_CLIENT_SECRET,
      "grant_type": "CLIENT_CREDENTIALS"
    }
    // let authResponse = await axios.post(process.env.MOTION_TOKEN_URL, null, {
    //   headers
    // })
    //   .then(response => {
    //     authToken = response.data.access_token;
    //     return response.data;
    //   }).catch(error => {
    //     console.error(error);
    //   });

    // chamada para motion confirmação
    let postBody = {
      status: StatusAgendamento
    }
    // let responseMotion = await axios.put(process.env.MOTION_AGENDAMENTO_URL + idAgendamento,
    //   postBody,
    //   {
    //     headers: { Authorization: `Bearer ${authToken}` }
    //   }
    // )
    //   .then(response => {
    //     console.log('Response:', response.data);
    //   })
    //   .catch(error => {
    //     if (error.response) {
    //       // The request was made and the server responded with a status code
    //       // that falls out of the range of 2xx
    //       let { data, status, headers } = error.response;
    //       throw `Error at motion call: Response: ${JSON.stringify(data)} - Response Status ${status}`
    //     } else if (error.request) {
    //       // The request was made but no response was received
    //       throw `Error at motion call: Request: ${JSON.stringify(error.request)}`
    //     } else {
    //       // Something happened in setting up the request that triggered an Error
    //       throw `Error at motion call: ${JSON.stringify(error.message)}`
    //     }
    //   });

    // Envia dados para a DE conigurada no painel
    if (DEExternalKey != '') {
      let body = [
        {
          keys: DEkeys,
          values: {
            [confirmacaoText]: StatusAgendamento,
            [confirmacaoBoolean]: true,
            [status]: 'SUCESSO',
            [saveDate]: now.format('YYYY-MM-DD HH:mm:ss')
          },
        },
      ];
      await SFClient.saveData(DEExternalKey, body).then(response => {
        console.log("Insert in ")
        if (response.res.statusCode >= 400) { // erro no envio dos dados para DE
          logger.error(`Error adding to error DE response: ${JSON.stringify(response.body)}`)
          logger.error(`Error adding to error DE request body: ${JSON.stringify(body)}`)
          throw `Error Updating Status to DE: ${JSON.stringify(response.body)}`
        }
      });
    } else {// envia dados para a DE da journey entry
      // atualiza dados na DE pelo ID
      await SFClient.saveDataByID(dataExtensionID, [
        {
          keys: DEkeys,
          values: {
            [confirmacaoText]: StatusAgendamento,
            [confirmacaoBoolean]: true,
            [status]: 'SUCESSO',
            [saveDate]: now.format('YYYY-MM-DD HH:mm:ss')
          },
        },
      ]).then(response => {
        if (response.res.statusCode >= 400) { // erro no envio dos dados para DE
          throw `Error Updating Status to entry DE: ${JSON.stringify(response.body)}`
        }
      });
      res.status(200).send({
        status: 'ok',
      });
    }
  } catch (error) { // Em caso de erro, atualiza DEs com erro
    // logger.error(error);
    console.log('Error: ', error);

    // Atualiza dados na DE configurada
    if (DEExternalKey != '') {
      let body = [
        {
          keys: DEkeys,
          values: {
            [confirmacaoText]: StatusAgendamento,
            [confirmacaoBoolean]: true,
            [status]: 'ERRO',
            [saveDate]: now.format('YYYY-MM-DD HH:mm:ss')
          },
        },
      ];
      await SFClient.saveData(DEExternalKey, body).then(response => {
        if (response.res.statusCode >= 400) { // erro no envio dos dados para DE
          logger.error(`Error adding to error DE response: ${JSON.stringify(response.body)}`)
          logger.error(`Error adding to error DE request body: ${JSON.stringify(body)}`)
          throw `Error Updating Status to DE: ${JSON.stringify(response.body)}`
        }
      });
    } else { // Atualiza dados da DE do journey entry
      // atualiza dados na DE com erro
      await SFClient.saveDataByID(dataExtensionID, [
        {
          keys: DEkeys,
          values: {
            [confirmacaoText]: StatusAgendamento,
            [confirmacaoBoolean]: StatusAgendamento == 'CONFIRMADO' ? true : false,
            [status]: 'ERRO'
          },
        },
      ]).then(response => {
        if (response.res.statusCode >= 400) { // erro no envio dos dados para DE
          // logger.error(`Error Updating Status to entry DE: ${JSON.stringify(response.body)}`);
        }
      });
    }


    const id = Uuidv1();
    let errorPostBody = [
      {
        keys: {
          Id: id,
        },
        values: {
          ActivityID: data.activityId,
          PayloadReceived: dataReceived,
          ErrorMessage: JSON.stringify(error),
        },
      },
    ]
    await SFClient.saveData(process.env.SFMC_ERROR_DE_EXTERNAL_KEY, errorPostBody).then(response => {
      if (response.res.statusCode >= 400) { // Erro ao adicionar dados na DE de erros
        logger.error(`Error adding to error DE request body: ${JSON.stringify(errorPostBody)}`)
        logger.error(`Error adding to error DE response: ${JSON.stringify(response.body)}`)
      }
    });


    res.status(200).send({
      status: 'ok',
    });
  };
}

/**
 * Endpoint that receives a notification when a user saves the journey.
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
exports.save = (req, res) => {
  res.status(200).send({
    success: true,
  });
};

/**
 *  Endpoint that receives a notification when a user publishes the journey.
 * @param req
 * @param res
 */
exports.publish = (req, res) => {
  res.status(200).send({
    status: 'ok',
  });
};

/**
 *  Endpoint that receives a notification when a user publishes the journey.
 * @param req
 * @param res
 */
exports.unpublish = (req, res) => {
  res.status(200).send({
    status: 'ok',
  });
};

/**
 * Endpoint that receives a notification when a user performs
 * some validation as part of the publishing process.
 * @param req
 * @param res
 */
exports.validate = async (req, res) => {
  // logger = new InfoLogger('activity.js');
  // logger.log.info(`Endpoint teste`);
  console.log("teste validate");
  res.status(200).send({
    success: true,
  });
};

/**
 * Endpoint that receives a notification when a user performs
 * some validation as part of the publishing process.
 * @param req
 * @param res
 */
exports.stop = (req, res) => {
  res.status(200).send({
    success: true,
  });
};
/**
 * Endpoint that receives a notification when a user performs
 * some validation as part of the publishing process.
 * @param req
 * @param res
 */
exports.testsave = (req, res) => {
  res.status(200).send({
    success: true,
  });
};
