import React, { Fragment } from 'react';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import loggerFactory from '@alias/logger';

import { createSubscribedElement } from '../../UnstatedUtils';
import { toastError } from '../../../util/apiNotification';

import AppContainer from '../../../services/AppContainer';
import AdminAppContainer from '../../../services/AdminAppContainer';

import AppSetting from './AppSetting';
import SiteUrlSetting from './SiteUrlSetting';
import MailSetting from './MailSetting';
import AwsSetting from './AwsSetting';
import PluginSetting from './PluginSetting';

const logger = loggerFactory('growi:appSettings');

class AppSettingsPage extends React.Component {

  async componentDidMount() {
    const { adminAppContainer } = this.props;

    try {
      await adminAppContainer.retrieveAppSettingsData();
    }
    catch (err) {
      toastError(err);
      adminAppContainer.setState({ retrieveError: err });
      logger.error(err);
    }
  }

  render() {
    const { t } = this.props;

    return (
      <Fragment>
        <div className="row">
          <div className="col-md-12">
            <h2>{t('App Settings')}</h2>
            <AppSetting />
          </div>
        </div>

        <div className="row">
          <div className="col-md-12">
            <h2>{t('Site URL settings')}</h2>
            <SiteUrlSetting />
          </div>
        </div>

        <div className="row">
          <div className="col-md-12">
            <h2>{t('app_setting.Mail settings')}</h2>
            <MailSetting />
          </div>
        </div>

        <div className="row">
          <div className="col-md-12">
            <h2>{t('app_setting.AWS settings')}</h2>
            <AwsSetting />
          </div>
        </div>

        <div className="row">
          <div className="col-md-12">
            <h2>{t('app_setting.Plugin settings')}</h2>
            <PluginSetting />
          </div>
        </div>
      </Fragment>
    );
  }

}

AppSettingsPage.propTypes = {
  t: PropTypes.func.isRequired, // i18next
  appContainer: PropTypes.instanceOf(AppContainer).isRequired,
  adminAppContainer: PropTypes.instanceOf(AdminAppContainer).isRequired,
};

/**
 * Wrapper component for using unstated
 */
const AppSettingsPageWrapper = (props) => {
  return createSubscribedElement(AppSettingsPage, props, [AppContainer, AdminAppContainer]);
};


export default withTranslation()(AppSettingsPageWrapper);
