export default class ColConfigDetails {
  constructor({
    idColConfigDetail = 0,
    idColConfigHeader = 0,
    colName = '',
    showName = '',
    position = 0,
    width = 120,
    visible = true,
    useForSort = false
  } = {}) {
    this.idColConfigDetail = idColConfigDetail;
    this.idColConfigHeader = idColConfigHeader;
    this.colName = colName;
    this.showName = showName;
    this.position = position;
    this.width = width;
    this.visible = visible;
    this.useForSort = useForSort;
  }
}