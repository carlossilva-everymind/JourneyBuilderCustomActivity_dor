require('dotenv').config();
const cookieParser = require('cookie-parser');
const express = require('express');
const helmet = require('helmet');
const httpErrors = require('http-errors');
const logger = require('morgan');
const path = require('path');
const bodyParser = require('body-parser');
const routes = require('./routes/index');
const activityRouter = require('./routes/activity');

// É utilizado o framework Express
const app = express();

// Configuração de segurança CORS
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'", 'www-mc-s11.exacttargetapis.com'],
        'script-src': ["'self'", 'www-mc-s11.exacttargetapis.com'],
        'frame-ancestors': ["'self'", `https://mc.${process.env.STACK}.exacttarget.com`, `https://jbinteractions.${process.env.STACK}.marketingcloudapps.com`],
      },
    },
  }),
);

// Configuração da engine para geração de HTML do front
// Neste exemplo foi utilizado a engine pug
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Configuração de algumas opções do Express
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.raw({
  type: 'application/jwt',
}));

app.use(express.static(path.join(__dirname, 'public')));

// serve config
app.use('/config.json', routes.config);

// Configuração das rotas da atividade customizada
// Essas rotas devem seguir a documentação da SF
app.use('/journey/execute/', activityRouter.execute);
app.use('/journey/save/', activityRouter.save);
app.use('/journey/publish/', activityRouter.publish);
app.use('/journey/unpublish/', activityRouter.unpublish);
app.use('/journey/validate/', activityRouter.validate);
app.use('/journey/stop/', activityRouter.stop);
app.use('/journey/TestSave/', activityRouter.testsave);

// Configuração da rota da interface
/* Esta rota é chamada quando é aberto o painel de configuração
 * da atividade customizada no Journey Builder
 */
app.use('/', routes.ui);

// catch 404 and forward to error handler
// Config para capturar erros 404 e redirecionar para o Error Handler
app.use((req, res, next) => {
  next(httpErrors(404));
});

// Configuração do error handler
// Sempre que ouver algum erro de chamada esses comandos serão executados
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
