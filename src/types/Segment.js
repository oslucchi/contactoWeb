export default class Segment {
    constructor({
        idSegment = 0,
        description = '',
        sub1 = '',
        sub2 = '',
        localCode = ''
    } = {}) {
        this.idSegment = idSegment;
        this.description = description;
        this.sub1 = sub1;
        this.sub2 = sub2;
        this.localCode = localCode;
    }
}
