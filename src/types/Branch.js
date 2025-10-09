export default class Branch {
    constructor({
        idBranch = 0,
        idCompany = 0,
        idBranchType = 0,
        name1 = '',
        web = '',
        email = '',
        street1 = '',
        street2 = '',
        zip = '',
        city = '',
        region = '',
        country = '',
    } = {}) {
        this.idBranch = idBranch;
        this.idCompany = idCompany;
        this.idBranchType = idBranchType;
        this.name1 = name1;
        this.web = web;
        this.email = email;
        this.street1 = street1;
        this.street2 = street2;
        this.zip = zip;
        this.city = city;
        this.region = region;
        this.country = country;
    }
}