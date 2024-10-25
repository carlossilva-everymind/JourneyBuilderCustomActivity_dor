const path = require('path');
const fs = require('fs');

/**
 * Render Config
 * @param req
 * @param res
 */
exports.config = (req, res) => {
  // const domain = process.env.DOMAIN + '/custom-activity';
  // const domain = process.env.DOMAIN;
  const domain = 'test-jb-custom-activity-dor-1a2631a1fafc.herokuapp.com';
  
  // const domain = 'salesforce-custom-activity.dev-k8s.rededorlabs.com';

  const file = path.join(__dirname, '..', 'public', 'config-template.json');

  const configTemplate = fs.readFileSync(file, 'utf-8');
  const config = JSON.parse(configTemplate.replace(/\$DOMAIN/g, domain));
  res.json(config);
};

/* Exportação do ui, utilizado na rota '/' (app.js)
 * Aqui é renderizado a view index passando alguns atributos, para que a view engine 
 * neste caso pug, crie o HTML
 */
/**
 * Render UI
 * @param req
 * @param res
 */
exports.ui = (req, res) => {
  res.render('index', {
    title: 'Confirmação de Agendamento no Motion',
    dropdownOptions: [
      {
        name: 'CONFIRMADO',
        value: 'CONFIRMADO',
      },
      {
        name: 'CANCELADO',
        value: 'CANCELADO',
      },
    ],
    sfmc_subdomain: process.env.SFMC_SUBDOMAIN,
    sfmc_account_id: process.env.SFMC_ACCOUNT_ID,
    sfmc_client_id: process.env.SFMC_CLIENT_ID,
    sfmc_client_secret: process.env.SFMC_CLIENT_SECRET,
    sfmc_jwt: process.env.JWT,
    domain: process.env.DOMAIN,
  });
};
