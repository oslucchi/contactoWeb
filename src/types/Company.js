import Branch from "./Branch";

export default class Company {
    constructor({
        idCompany = 0,
        idSegment = 0,
        description = '',
        segment = '',
        branches = [],
        roleInProject = ""
    } = {}) {
        this.idCompany = idCompany;
        this.idSegment = idSegment;
        this.description = description;
        this.segment = segment;
        this.branches = branches.map(branch => branch instanceof Branch ? branch : new Branch(branch));
        this.roleInProject = roleInProject;
    }
}