export default class ColConfigDetails {
  constructor({
    idColConfigDetail = 0,
    idColConfigHeader = 0,
    idUser = 0,
    colName = '',
    showName = '',
    position = 0,
    width = 120,
    renderLayout = '',
    visible = true,
    useForSort = false,
    style = '',
    useInSearch = false,
    editEndpoint = '',
    editMethod = '',
    editPayloadTemplate = '',
  } = {}) {
    this.idColConfigDetail = idColConfigDetail;
    this.idColConfigHeader = idColConfigHeader;
    this.idUser = idUser;
    this.colName = colName;
    this.showName = showName;
    this.position = position;
    this.width = width;
    this.renderLayout = renderLayout;
    this.visible = visible;
    this.useForSort = useForSort;
    this.style = style;
    this.useInSearch = useInSearch;
    this.editEndpoint = editEndpoint;
    this.editMethod = editMethod;
    this.editPayloadTemplate = editPayloadTemplate;
  }
}