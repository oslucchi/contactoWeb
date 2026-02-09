/**
 * Event Status Constants
 * These map to the Status table in the database
 */
export const EVENT_STATUS = {
  PENDING: 1,
  IN_PROGRESS: 2,
  COMPLETED: 3,
  CANCELLED: 4
};

/**
 * Event Outcome Constants
 * These map to the Outcome table in the database
 */
export const EVENT_OUTCOME = {
  PENDING: 1,
  SUCCESSFUL: 2,
  UNSUCCESSFUL: 3
};

/**
 * Event Category Constants
 * These map to the EventCategories table in the database
 */
export const EVENT_CATEGORY = {
  PHONE_CALL: 1,
  MEET_IN_PERSON: 2,
  VIDEO_CALL: 3,
  NONE: 4,
  QUOTE_REQUEST: 5
};

/**
 * Event Category Icons
 * Maps category IDs to their icon filenames
 */
export const EVENT_CATEGORY_ICONS = {
  [EVENT_CATEGORY.PHONE_CALL]: 'phoneCall.png',
  [EVENT_CATEGORY.MEET_IN_PERSON]: 'meetInPerson.png',
  [EVENT_CATEGORY.VIDEO_CALL]: 'videoCall.png',
  [EVENT_CATEGORY.NONE]: 'iconaBianca.png',
  [EVENT_CATEGORY.QUOTE_REQUEST]: 'dollar.png'
};

/**
 * Default event duration in minutes
 */
export const DEFAULT_EVENT_DURATION = {
  PHONE_CALL: 15,
  MEETING: 60,
  VIDEO_CALL: 30
};


export const REPORT_STATUS = {
  ACTIVE: false,
  ARCHIVED: true
};