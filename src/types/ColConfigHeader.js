import ColConfigDetails from './ColConfigDetails';

export default class ColConfigHeader {
  constructor({
    idColConfigHeader = 0,
    page = '',
    element = '',
    user = 0,
    cliClassName = '',
    restModuleName = '',
    dataCollectMethod = '',
    showTitle = '',
    primaryKey = '',
    columns = []
  } = {}) {
    this.idColConfigHeader = idColConfigHeader;
    this.page = page;
    this.element = element;
    this.user = user;
    this.cliClassName = cliClassName;
    this.restModuleName = restModuleName;
    this.dataCollectMethod = dataCollectMethod;
    this.showTitle = showTitle;
    this.primaryKey = primaryKey;
    this.columns = columns.map(c => c instanceof ColConfigDetails ? c : new ColConfigDetails(c));
  }
}