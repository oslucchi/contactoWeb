import Branch from "./Branch";

export default class Company {
    constructor({
        idCompany = 0,
        idSegment = 0,
        description = '',
        segment = '',
        score = 0,
        turnover = 0,
        employees = 0,
        branches = [],
        roleInProject = "",
        lastEventDate = null,
        lastReportDate = null
    } = {}) {
        this.idCompany = idCompany;
        this.idSegment = idSegment;
        this.description = description;
        this.segment = segment;
        this.score = score;
        this.turnover = turnover;
        this.employees = employees;
        this.branches = branches.map(branch => branch instanceof Branch ? branch : new Branch(branch));
        this.roleInProject = roleInProject;
        this.lastEventDate = lastEventDate;
        this.lastReportDate = lastReportDate;
    }
}