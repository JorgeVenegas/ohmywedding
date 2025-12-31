// Supported locales
export type Locale = 'en' | 'es'

// Translation keys structure
export interface Translations {
  // Common UI elements
  common: {
    loading: string
    tapToOpen: string
    from: string
    to: string
    save: string
    cancel: string
    edit: string
    delete: string
    confirm: string
    back: string
    next: string
    close: string
    add: string
    remove: string
    change: string
    select: string
    upload: string
    search: string
    noResults: string
    required: string
    optional: string
    yes: string
    no: string
    or: string
    and: string
    deleteSection: string
    deleteConfirmTitle: string
    deleteConfirmMessage: string
    deleteConfirmWarning: string
  }

  // Navigation
  nav: {
    home: string
    ourStory: string
    eventDetails: string
    gallery: string
    rsvp: string
    faq: string
    schedule: string
    location: string
  }

  // Hero Section
  hero: {
    wereGettingMarried: string
    joinUs: string
    saveTheDate: string
    weInviteYou: string
    viewDetails: string
    rsvpNow: string
    tagline: string
    untilBigDay: string
    todayIsTheDay: string
    justMarried: string
  }

  // Countdown Section
  countdown: {
    title: string
    untilWeSayIDo: string
    years: string
    year: string
    months: string
    month: string
    days: string
    day: string
    hours: string
    hour: string
    minutes: string
    minute: string
    seconds: string
    second: string
    weddingDay: string
    congratulations: string
  }

  // Our Story Section
  ourStory: {
    title: string
    subtitle: string
    ourJourney: string
    chapterOne: string
    howWeMet: string
    howWeMetDefault: string
    theBigMoment: string
    theProposal: string
    proposalDefault: string
  }

  // Event Details Section
  eventDetails: {
    title: string
    subtitle: string
    joinUsForOurCelebration: string
    ceremony: string
    reception: string
    date: string
    time: string
    venue: string
    address: string
    getDirections: string
    viewOnMap: string
    dressCode: string
    additionalInfo: string
    ceremonyDescriptionDefault: string
    receptionDescriptionDefault: string
    followingCeremony: string
    eventTypes: {
      civilCeremony: string
      religiousCeremony: string
      cocktail: string
      reception: string
      afterParty: string
      custom: string
    }
    addEvent: string
    removeEvent: string
    customEventName: string
    useWeddingDate: string
    eventDate: string
    eventOrder: string
    eventTypeDescription: string
    titleDescription: string
    eventNamePlaceholder: string
    timeDescription: string
    venueDescription: string
    venuePlaceholder: string
    addressDescription: string
    addressPlaceholder: string
    descriptionDescription: string
  }

  // RSVP Section
  rsvp: {
    title: string
    subtitle: string
    firstName: string
    lastName: string
    email: string
    phone: string
    attending: string
    notAttending: string
    willYouAttend: string
    numberOfGuests: string
    guestNames: string
    mealPreference: string
    selectMealOption: string
    beef: string
    chicken: string
    fish: string
    vegetarian: string
    vegan: string
    dietaryRestrictions: string
    dietaryRestrictionsPlaceholder: string
    specialRequests: string
    message: string
    messagePlaceholder: string
    submit: string
    submitting: string
    thankYou: string
    responseReceived: string
    lookingForward: string
    willMissYou: string
    updateResponse: string
    deadline: string
    pleaseRespondBy: string
    confirmAttendance: string
    declineWithRegrets: string
    guestOf: string
    plusOne: string
    children: string
    adultsOnly: string
    error: string
    tryAgain: string
    alreadySubmitted: string
    responseRecorded: string
    editResponse: string
    willAttend: string
    cannotAttend: string
    accept: string
    decline: string
    messageToCouple: string
    messageToCoupleOptional: string
    messagePlaceholderShort: string
    submittingResponse: string
    submitResponse: string
    partyOf: string
    respondForAll: string
    individualInvitationsMessage: string
    verifyPhone: string
    phoneVerification: string
    phoneVerificationDescription: string
    enterPhoneNumber: string
    sendVerificationCode: string
    enterVerificationCode: string
    verificationCodeSent: string
    verificationCodePlaceholder: string
    verifyCode: string
    resendCode: string
    phoneVerified: string
    invalidCode: string
    codeSentTo: string
    verificationRequired: string
    selectPhoneNumber: string
    selectPhoneToVerify: string
    selectPhone: string
    continue: string
    enterCompletePhone: string
    phoneEndsIn: string
    completePhoneNumber: string
    enterCompletePhoneNumber: string
    verify: string
    tryDifferentPhone: string
    phoneDoesNotMatch: string
    invalidPhone: string
    phoneVerificationFailed: string
    areyouTraveling: string
    travelingFrom: string
    travelingFromPlaceholder: string
    travelArrangement: string
    needsTransport: string
    ownMeans: string
    willBuyTicket: string
    noTicketNeeded: string
    uploadTicket: string
    uploadTravelTicket: string
    ticketUploaded: string
    removeTicket: string
    uploadingTicket: string
    ticketRequired: string
    maxFileSize: string
    travelRequiredByOrganizer: string
    noTicketReason: string
    noTicketReasonPlaceholder: string
    reasonRequired: string
  }

  // Gallery Section
  gallery: {
    title: string
    subtitle: string
    viewAll: string
    photo: string
    photos: string
    of: string
    previous: string
    next: string
    close: string
    download: string
    share: string
    capturedMoments: string
    photosComingSoon: string
    checkBackSoon: string
    // Variant labels
    carousel: string
    banner: string
    masonry: string
    grid: string
    list: string
    // Variant descriptions
    carouselDesc: string
    bannerDesc: string
    masonryDesc: string
    gridDesc: string
    listDesc: string
    // Config labels
    uploadPhotos: string
    managePhotos: string
    addPhotos: string
    photoCaption: string
    noPhotosYet: string
    uploadYourFirst: string
  }

  // FAQ Section
  faq: {
    title: string
    subtitle: string
    noFaqsYet: string
    questionsWillAppear: string
    haveQuestion: string
    contactNote: string
    contactNoteDefault: string
    question: string
    answer: string
    addQuestion: string
    editQuestion: string
  }

  // Registry Section
  registry: {
    title: string
    subtitle: string
    message: string
    noRegistriesYet: string
    registriesWillAppear: string
    viewRegistry: string
    visitRegistry: string
    visit: string
    ourWishlist: string
    fulfilled: string
    addRegistry: string
    removeRegistry: string
    registryName: string
    registryUrl: string
    selectProvider: string
    customRegistry: string
    manageWishlist: string
    addItem: string
    itemName: string
    itemDescription: string
    itemPrice: string
    itemImage: string
    quantity: string
    showCustomRegistry: string
    customTitle: string
    customDescription: string
    pageTitle: string
    pageSubtitle: string
    loadingRegistry: string
    noItemsAvailable: string
    progress: string
    funded: string
    goalReached: string
    fullyFunded: string
    contribute: string
    contributeTo: string
    everyContribution: string
    contributionAmount: string
    remaining: string
    yourName: string
    email: string
    messageLabel: string
    addPersonalMessage: string
    proceedToPayment: string
    processing: string
    thankYou: string
    confirmationEmail: string
    providers: {
      amazon: string
      liverpool: string
      palacio: string
      target: string
      ikea: string
      crateBarrel: string
      williamsSonoma: string
      zola: string
      honeyfund: string
      bedBath: string
      custom: string
    }
  }

  // Schedule Section
  schedule: {
    title: string
    subtitle: string
    timeline: string
    event: string
    time: string
    description: string
    location: string
  }

  // Location Section
  location: {
    title: string
    subtitle: string
    ceremonyLocation: string
    receptionLocation: string
    parkingInfo: string
    accommodations: string
    nearbyHotels: string
    transportation: string
  }

  // Footer
  footer: {
    madeWithLove: string
    by: string
    copyright: string
    allRightsReserved: string
  }

  // Date & Time formatting
  dateTime: {
    at: string
    to: string
    from: string
    on: string
  }

  // Months
  months: {
    january: string
    february: string
    march: string
    april: string
    may: string
    june: string
    july: string
    august: string
    september: string
    october: string
    november: string
    december: string
  }

  // Days of week
  daysOfWeek: {
    sunday: string
    monday: string
    tuesday: string
    wednesday: string
    thursday: string
    friday: string
    saturday: string
  }

  // Config/Admin labels (for editing panels)
  config: {
    variant: string
    layout: string
    style: string
    content: string
    display: string
    settings: string
    background: string
    colors: string
    textAlignment: string
    left: string
    center: string
    right: string
    show: string
    hide: string
    enabled: string
    disabled: string
    photo: string
    // Section names for config panels
    sectionMainBanner: string
    sectionCountdown: string
    sectionOurStory: string
    sectionRsvp: string
    sectionGallery: string
    sectionFaq: string
    sectionEventDetails: string
    sectionComingSoon: string
    unknownSection: string
    photos: string
    addPhoto: string
    removePhoto: string
    selectImage: string
    changeImage: string
    uploadImage: string
    // Form labels
    sectionTitle: string
    sectionSubtitle: string
    sectionContent: string
    backgroundColor: string
    displayOptions: string
    showEmbeddedMap: string
    showMapLinks: string
    showVenuePhotos: string
    ceremony: string
    reception: string
    ceremonyDescription: string
    receptionDescription: string
    ceremonyImage: string
    receptionImage: string
    faqStyle: string
    allowMultipleOpen: string
    showContactNote: string
    contactNoteText: string
    questions: string
    question: string
    answer: string
    addQuestion: string
    deleteQuestion: string
    editQuestion: string
    moveUp: string
    moveDown: string
    noQuestions: string
    // FAQ variant labels
    accordion: string
    cardsGrid: string
    simpleList: string
    elegant: string
    // Event Details variant labels
    splitLayout: string
    // Gallery variant labels
    galleryCarousel: string
    galleryBanner: string
    galleryMasonry: string
    galleryGrid: string
    galleryList: string
    // Descriptions
    classicCardsDesc: string
    galleryCarouselDesc: string
    galleryBannerDesc: string
    galleryMasonryDesc: string
    galleryGridDesc: string
    galleryListDesc: string
    elegantScriptDesc: string
    timelineDesc: string
    minimalCleanDesc: string
    splitLayoutDesc: string
    accordionDesc: string
    cardsGridDesc: string
    simpleListDesc: string
    // Placeholders
    enterTitle: string
    enterSubtitle: string
    enterQuestion: string
    enterAnswer: string
    enterDescription: string
    none: string
    primary: string
    secondary: string
    accent: string
    primaryLight: string
    primaryLighter: string
    secondaryLight: string
    secondaryLighter: string
    accentLight: string
    accentLighter: string
    // Bulk mode
    bulkMode: string
    bulkUploadMode: string
    bulkUploadDesc: string
    // Hero config
    layoutStyle: string
    heroImage: string
    backgroundHero: string
    sideBySide: string
    framedPhoto: string
    minimal: string
    stacked: string
    overlayOpacity: string
    imageBrightness: string
    useGradientOverlay: string
    gradientColor1: string
    gradientColor2: string
    imagePosition: string
    useColorBackground: string
    transparent: string
    dark: string
    darker: string
    bright: string
    showDecorations: string
    showTagline: string
    tagline: string
    showCountdown: string
    showRSVPButton: string
    imageFrame: string
    circular: string
    rounded: string
    square: string
    polaroid: string
    imageSize: string
    small: string
    medium: string
    large: string
    full: string
    imageHeight: string
    imageWidth: string
    centered: string
    // Our Story config
    storyLayout: string
    contentSections: string
    showHowWeMet: string
    showProposalStory: string
    howWeMetStory: string
    howWeMetPhoto: string
    showHowWeMetPhoto: string
    tellYourStory: string
    proposalStory: string
    proposalPhoto: string
    showProposalPhoto: string
    // Countdown config
    countdownStyle: string
    countdownMessage: string
    showYears: string
    showMonths: string
    showDays: string
    showHours: string
    showMinutes: string
    showSeconds: string
    classicCards: string
    minimalClean: string
    circularProgress: string
    elegantScript: string
    modernBold: string
    // RSVP config
    rsvpStyle: string
    callToAction: string
    embeddedForm: string
    formOptions: string
    showMealPreferences: string
    enableCustomQuestions: string
    customQuestions: string
    textInput: string
    textArea: string
    dropdown: string
    checkbox: string
    required: string
    options: string
    optionsOnePer: string
    removeQuestion: string
    // Variant labels (short names) - for Our Story section
    cardsLayout: string
    timeline: string
    zigzag: string
    booklet: string
    splitView: string
    // Variant descriptions (longer explanations)
    backgroundHeroDesc: string
    sideBySideDesc: string
    framedPhotoDesc: string
    minimalDesc: string
    stackedDesc: string
    callToActionDesc: string
    embeddedFormDesc: string
    cardsLayoutDesc: string
    zigzagDesc: string
    bookletDesc: string
    splitViewDesc: string
    // Wedding details form
    partnerNames: string
    partner1FirstName: string
    partner1LastName: string
    partner2FirstName: string
    partner2LastName: string
    firstName: string
    lastName: string
    weddingDate: string
    weddingUrl: string
    weddingNameId: string
    weddingNameIdHint: string
    date: string
    time: string
    venueName: string
    address: string
    fullAddress: string
    savedSuccessfully: string
    failedToSave: string
    noChanges: string
  }

  // Editing UI (page creator interface)
  editing: {
    edit: string
    preview: string
    save: string
    saving: string
    saved: string
    saveChanges: string
    discard: string
    confirm: string
    settings: string
    signIn: string
    signInToEdit: string
    signOut: string
    signedInAs: string
    desktop: string
    mobile: string
    language: string
    siteLanguage: string
    selectLanguage: string
    weddingDetails: string
    theme: string
    sharing: string
    addSection: string
    removeSection: string
    moveUp: string
    moveDown: string
    customize: string
    weddingSettings: string
    collaborators: string
    inviteCollaborator: string
    addCollaborator: string
    removeCollaborator: string
    owner: string
    editor: string
    viewer: string
    navigationSettings: string
    showNavigationLinks: string
    navigationBackground: string
    noColor: string
    colorBackground: string
    fontSettings: string
    colorSettings: string
    selectFontPairing: string
    selectColorTheme: string
    customColors: string
    primaryColor: string
    secondaryColor: string
    accentColor: string
  }

  // Image Gallery Dialog
  imageGallery: {
    title: string
    selectImage: string
    uploadImages: string
    uploadOrSelect: string
    chooseFromGallery: string
    uploadToGallery: string
    clickToUpload: string
    dragAndDrop: string
    fileFormats: string
    uploading: string
    yourImages: string
    noImagesYet: string
    uploadToStart: string
    cancel: string
    select: string
    uploadError: string
  }

  // Error messages
  errors: {
    somethingWentWrong: string
    pageNotFound: string
    unauthorized: string
    networkError: string
    validationError: string
    requiredField: string
    invalidEmail: string
    invalidPhone: string
  }
}

// Type for translation function
export type TranslationFunction = (key: string, params?: Record<string, string | number>) => string
