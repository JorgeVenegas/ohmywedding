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
    uploading: string
    view: string
    search: string
    noResults: string
    required: string
    optional: string
    yes: string
    no: string
    or: string
    and: string
    move: string
    deleteSection: string
    deleteConfirmTitle: string
    deleteConfirmMessage: string
    deleteConfirmWarning: string
    deleteCollaboratorMessage: string
    deleteCollaboratorWarning: string
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
    noResponse: string
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
    respondForAtLeastOne: string
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
    uploadTicketProof: string
    ticketUploaded: string
    clickToUploadTicket: string
    acceptedFormats: string
    ticketRequired: string
    travelInfoRequired: string
    alreadyBookedTransportation: string
    noTicketNeeded: string
    willNotNeedTransportation: string
    travelRequiredByOrganizer: string
    applyToAllGuests: string
    applyToAllDescription: string
    travelSummary: string
    traveling: string
    notTraveling: string
    from: string
    travelDetails: string
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
    masonry: string
    grid: string
    list: string
    collage: string
    // Variant descriptions
    carouselDesc: string
    masonryDesc: string
    gridDesc: string
    listDesc: string
    collageDesc: string
    // Config labels
    uploadPhotos: string
    managePhotos: string
    addPhotos: string
    photoCaption: string
    noPhotosYet: string
    uploadYourFirst: string
    noCaption: string
    editPhoto: string
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

  // Banner Section
  banner: {
    title: string
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
    contributionsUnavailable: string
    contributionsUnavailableDescription: string
    comingSoon: string
    checkingStatus: string
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
    gridColumns: string
    masonryColumns: string
    bannerHeight: string
    show: string
    hide: string
    enabled: string
    disabled: string
    photo: string
    // Section names for config panels
    sectionMainBanner: string
    sectionBanner: string
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
    image: string
    images: string
    bannerImage: string
    showText: string
    title: string
    subtitle: string
    overlayOpacity: string
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
    galleryCollage: string
    // Descriptions
    classicCardsDesc: string
    galleryCarouselDesc: string
    galleryBannerDesc: string
    galleryMasonryDesc: string
    galleryGridDesc: string
    galleryListDesc: string
    galleryCollageDesc: string
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
    // Image position
    imageFocalPoint: string
    topLeft: string
    topCenter: string
    topRight: string
    centerLeft: string
    centerRight: string
    bottomLeft: string
    bottomCenter: string
    bottomRight: string
    imagePosition: string
    imageZoom: string
    fitImage: string
    zoomIn: string
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
    imageBrightness: string
    useGradientOverlay: string
    gradientColor1: string
    gradientColor2: string
    useColorBackground: string
    transparent: string
    opaque: string
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
    fullScreen: string
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
    moveUpDisabled: string
    moveDownDisabled: string
    moveTo: string
    moveBefore: string
    moveAfter: string
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

  // Activity & Invitation Tracking
  activity: {
    // Activity types
    invitationOpened: string
    rsvpConfirmed: string
    rsvpDeclined: string
    rsvpUpdated: string
    guestAdded: string
    guestRemoved: string
    groupCreated: string
    groupUpdated: string
    // Activity feed
    recentActivity: string
    noRecentActivity: string
    noActivityYet: string
    refreshActivity: string
    viewAllActivity: string
    loadingActivity: string
    justNow: string
    minutesAgo: string
    hoursAgo: string
    daysAgo: string
    // Invitation stats
    invitationStats: string
    openRate: string
    totalOpens: string
    uniqueOpens: string
    opened: string
    notOpened: string
    openedInvitations: string
    unopenedInvitations: string
    firstOpened: string
    lastOpened: string
    timesOpened: string
    // Device types
    mobile: string
    tablet: string
    desktop: string
    deviceBreakdown: string
    // Filters
    filterByOpened: string
    allInvitations: string
    showOpened: string
    showNotOpened: string
    // Stats labels
    guests: string
    groups: string
    invitations: string
    responses: string
    attending: string
    notAttending: string
    pending: string
  }

  // Landing page
  landing: {
    nav: {
      features: string
      experience: string
      pricing: string
      templates: string
      signIn: string
      getStarted: string
      createWedding: string
      yourWeddings: string
      editWedding: string
      signOut: string
      signedInAs: string
    }
    hero: {
      title: string
      subtitle: string
      rotatingWords: string[]
      cta: string
      secondary: string
      scrollToExplore: string
      stats: {
        couples: string
        countries: string
        rating: string
      }
    }
    about: {
      label: string
      title: string
      subtitle: string
      description1: string
      description2: string
      pills: {
        templates: string
        domain: string
        notifications: string
        customization: string
      }
      testimonial: {
        quote: string
        author: string
      }
    }
    features: {
      label: string
      title: string
      subtitle: string
      description: string
      items: {
        invitationTracking: { title: string; description: string }
        rsvpDashboard: { title: string; description: string }
        subdomain: { title: string; description: string }
        messageTemplates: { title: string; description: string }
        notifications: { title: string; description: string }
        luxuryExperience: { title: string; description: string }
      }
    }
    experience: {
      label: string
      title: string
      subtitle: string
      sections: {
        hero: { title: string; subtitle: string; description: string }
        countdown: { title: string; subtitle: string; description: string }
        ourStory: { title: string; subtitle: string; description: string }
        eventDetails: { title: string; subtitle: string; description: string }
        rsvp: { title: string; subtitle: string; description: string }
        gallery: { title: string; subtitle: string; description: string }
      }
    }
    pricing: {
      label: string
      title: string
      subtitle: string
      description: string
      comparePlans: string
      features: string
      free: string
      premium: string
      deluxe: string
      mostPopular: string
      luxury: string
      learnMore: string
      guarantee: {
        secure: string
        moneyBack: string
      }
    }
    goldenBanner: {
      quote: string
    }
    templates: {
      label: string
      title: string
      subtitle: string
      previewTemplate: string
      viewAll: string
    }
    testimonials: {
      label: string
      title: string
      subtitle: string
    }
    finalCta: {
      label: string
      title: string
      subtitle: string
      description: string
      cta: string
      note: string
    }
    footer: {
      product: string
      support: string
      faq: string
      contactUs: string
      privacyPolicy: string
      termsOfService: string
      madeWith: string
      privacyDescription: string
    }
  }

  // Upgrade page
  upgrade: {
    title: string
    subtitle: string
    description: string
    alreadyPremium: {
      title: string
      description: string
      goToDashboard: string
    }
    comparePlans: string
    features: string
    mostPopular: string
    luxury: string
    upgradeNow: string
    goDeluxe: string
    redirecting: string
    learnMore: string
    guarantee: {
      encrypted: string
      instantAccess: string
      securePayment: string
    }
    weddingSelector: {
      title: string
      description: string
      currentPlan: string
    }
    errors: {
      noWedding: string
      allUpgraded: string
      generic: string
    }
  }

  // Plans (shared for premium & deluxe pages)
  plans: {
    common: {
      oneTimePayment: string
      noSubscriptions: string
      yoursForever: string
      completelyPersonalized: string
      upgradeToPremuim: string
      getDeluxe: string
      learnAboutDeluxe: string
      learnAboutPremium: string
      seeAllFeatures: string
      discoverExperience: string
      privacy: string
      terms: string
      home: string
      madeWith: string
    }
    premium: {
      label: string
      heroTitle: string
      heroHighlight: string
      heroDescription: string
      promise: {
        label: string
        title: string
        subtitle: string
        description: string
        tools: { title: string; description: string }
        guidance: { title: string; description: string }
        fromDayOne: { title: string; description: string }
      }
      features: {
        label: string
        title: string
        subtitle: string
        items: {
          guests: { title: string; description: string }
          invitations: { title: string; description: string }
          registry: { title: string; description: string }
          domain: { title: string; description: string }
          tracking: { title: string; description: string }
          reports: { title: string; description: string }
          forever: { title: string; description: string }
          guidance: { title: string; description: string }
        }
      }
      howItWorks: {
        label: string
        title: string
        steps: {
          upgrade: { title: string; description: string }
          access: { title: string; description: string }
          build: { title: string; description: string }
          celebrate: { title: string; description: string }
        }
      }
      comparison: {
        label: string
        title: string
        feature: string
      }
      whyUpgrade: {
        label: string
        title: string
        reasons: {
          forever: { title: string; description: string }
          guestManagement: { title: string; description: string }
          registry: { title: string; description: string }
          guidance: { title: string; description: string }
          tracking: { title: string; description: string }
          pricing: { title: string; description: string }
        }
      }
      testimonials: {
        label: string
        title: string
      }
      faq: {
        label: string
        title: string
        items: Array<{ q: string; a: string }>
      }
      deluxeUpsell: {
        title: string
        description: string
      }
      finalCta: {
        title: string
        highlight: string
        description: string
      }
    }
    deluxe: {
      label: string
      heroTitle: string
      heroHighlight: string
      heroDescription: string
      difference: {
        label: string
        title: string
        highlight: string
        subtitle: string
        description: string
        items: {
          design: { title: string; description: string }
          components: { title: string; description: string }
          agent: { title: string; description: string }
          detail: { title: string; description: string }
        }
      }
      features: {
        label: string
        title: string
        subtitle: string
        description: string
        items: {
          personalizedDesign: { title: string; description: string }
          customComponents: { title: string; description: string }
          dedicatedAgent: { title: string; description: string }
          unlimitedGuests: { title: string; description: string }
          invitations: { title: string; description: string }
          registry: { title: string; description: string }
          customDomain: { title: string; description: string }
          activityTracking: { title: string; description: string }
          dailyReports: { title: string; description: string }
          prioritySupport: { title: string; description: string }
          websiteForever: { title: string; description: string }
          weBuildEverything: { title: string; description: string }
        }
      }
      process: {
        label: string
        title: string
        subtitle: string
        description: string
        steps: {
          discovery: { title: string; description: string }
          design: { title: string; description: string }
          build: { title: string; description: string }
          review: { title: string; description: string }
          launch: { title: string; description: string }
        }
      }
      comparison: {
        label: string
        title: string
        subtitle: string
        description: string
        aspects: {
          whoBuilds: { label: string; premium: string; deluxe: string }
          designApproach: { label: string; premium: string; deluxe: string }
          components: { label: string; premium: string; deluxe: string }
          support: { label: string; premium: string; deluxe: string }
          guestLimit: { label: string; premium: string; deluxe: string }
          activityTracking: { label: string; premium: string; deluxe: string }
          reports: { label: string; premium: string; deluxe: string }
          price: { label: string }
        }
      }
      forWho: {
        label: string
        title: string
        profiles: {
          busy: { title: string; description: string }
          designLovers: { title: string; description: string }
          destination: { title: string; description: string }
          large: { title: string; description: string }
        }
      }
      testimonials: {
        label: string
        title: string
        items: Array<{ quote: string; name: string; detail: string }>
      }
      faq: {
        label: string
        title: string
        items: Array<{ q: string; a: string }>
      }
      finalCta: {
        title: string
        highlight: string
        subtitle: string
        description: string
      }
    }
  }

  // Authentication pages
  auth: {
    login: {
      createAccount: string
      welcomeBack: string
      signUpSubtitle: string
      signInSubtitle: string
      continueWithGoogle: string
      orContinueWithEmail: string
      email: string
      password: string
      minPassword: string
      creatingAccount: string
      signingIn: string
      createAccountBtn: string
      signInBtn: string
      alreadyHaveAccount: string
      dontHaveAccount: string
      signIn: string
      signUp: string
      andCreateWedding: string
    }
    createWedding: {
      essentialDetails: string
      essentialDetailsDesc: string
      yourNames: string
      firstName: string
      lastName: string
      optional: string
      iHaveDate: string
      weddingDate: string
      ceremonyTime: string
      receptionTime: string
      websiteLanguage: string
      chooseStartingPoint: string
      chooseStartingPointDesc: string
      aiDesignAssistant: string
      newBadge: string
      describeYourDream: string
      designing: string
      designMySite: string
      orChooseTemplate: string
      browseTemplates: string
      curatedDesigns: string
      startFromScratch: string
      fullCustomization: string
      addYourPhotos: string
      addYourPhotosDesc: string
      clickToSelect: string
      selectMultiple: string
      uploadingPhotos: string
      uploaded: string
      clearAll: string
      autoArrange: string
      distributing: string
      styleYourWebsite: string
      styleYourWebsiteDesc: string
      colorPalette: string
      fontStyle: string
      selectColorPalette: string
      selectFontPairing: string
      pageSections: string
      pageSectionsDesc: string
      fullCustomizationMode: string
      configureEveryDetail: string
      dragToReorder: string
      readyToCreate: string
      enterNamesAbove: string
      sections: string
      creatingWebsite: string
      pleaseWait: string
      createWebsiteBtn: string
    }
  }

  // Admin dashboard
  admin: {
    dashboard: {
      viewWebsite: string
      signOut: string
      welcomeBack: string
      manageDescription: string
      management: string
      cards: {
        invitations: { title: string; description: string }
        registry: { title: string; description: string }
        settings: { title: string; description: string }
        seating: { title: string; description: string }
      }
    }
    layout: {
      verifyingAccess: string
      noPermission: string
      noPermissionDescription: string
      goHome: string
    }
    settings: {
      title: string
      description: string
      backToDashboard: string
      nav: {
        subscription: string
        rsvp: string
        registry: string
        invitations: string
        gallery: string
        general: string
      }
      subscription: {
        title: string
        currentPlan: string
        status: string
        expires: string
      }
      features: {
        title: string
        rsvp: { name: string; description: string }
        invitations: { name: string; description: string }
        gallery: { name: string; description: string }
        registry: { name: string; description: string }
        schedule: { name: string; description: string }
      }
      upgradeToPremium: string
      upgradeDescription: string
      premiumFeature: string
      rsvpSettings: {
        title: string
        travelConfirmation: string
        requireTicket: string
        requireReason: string
        allowPlusOnes: string
        rsvpDeadline: string
      }
      gallerySettings: {
        allowGuestUploads: string
        moderation: string
      }
      generalSettings: {
        timezone: string
        language: string
      }
      saving: string
      active: string
      inactive: string
      locked: string
    }
    registry: {
      title: string
      customRegistry: string
      description: string
      stats: {
        items: string
        goal: string
        raised: string
        contributions: string
        received: string
      }
      filters: {
        allStatus: string
        active: string
        inactive: string
        newest: string
        oldest: string
        highestGoal: string
        lowestGoal: string
        allItems: string
        completed: string
        requiresAction: string
        failed: string
      }
      stripe: {
        connected: string
        setupIncomplete: string
        dashboard: string
      }
      form: {
        titleLabel: string
        descriptionLabel: string
        goalAmount: string
        images: string
      }
      buttons: {
        addItem: string
        createItem: string
        updateItem: string
        activate: string
        deactivate: string
      }
      empty: {
        noItems: string
        createFirst: string
        noMatch: string
      }
      progress: string
      funded: string
      itemsTab: string
      contributionsTab: string
    }
    invitations: {
      notifications: {
        groupCreated: string
        guestCreated: string
        importComplete: string
        assignedToGroup: string
      }
      errors: {
        failedCreateGuest: string
        failedSetTravel: string
        generic: string
      }
      confirmDelete: {
        group: string
        guests: string
        guestsMessage: string
      }
      csv: {
        groupName: string
        tags: string
        dietaryRestrictions: string
        notes: string
        status: string
        invitedBy: string
      }
      defaults: {
        partner1: string
        partner2: string
        unnamedGroup: string
        noGroup: string
        newGroup: string
        tbd: string
      }
      whatsapp: {
        noPhoneNumbers: string
        opened: string
      }
      status: {
        notSpecified: string
        comingSoon: string
        updated: string
        deleted: string
      }
    }
    seating: {
      title: string
      description: string
      backToDashboard: string
      toolbar: {
        addRoundTable: string
        addRectTable: string
        addElement: string
        zoomIn: string
        zoomOut: string
        fitToScreen: string
        autoAssign: string
        printExport: string
        save: string
        saving: string
        saved: string
        unsavedChanges: string
      }
      stats: {
        totalGuests: string
        assigned: string
        unassigned: string
        tables: string
        overfilled: string
        capacity: string
      }
      table: {
        name: string
        shape: string
        round: string
        rectangular: string
        capacity: string
        sideA: string
        sideB: string
        rotation: string
        width: string
        height: string
        duplicate: string
        delete: string
        deleteConfirm: string
        deleteWarning: string
        guests: string
        noGuests: string
        overfilled: string
        overfilledWarning: string
        moveGuest: string
        removeGuest: string
        viewGuests: string
      }
      guests: {
        unassigned: string
        search: string
        assignToTable: string
        assignGroup: string
        dragToAssign: string
        allAssigned: string
        filterConfirmed: string
        autoAssignTitle: string
        autoAssignDesc: string
        keepGroups: string
        assigned: string
        guests: string
        selectTableFirst: string
        guestList: string
        filterAll: string
        noResults: string
      }
      moveDialog: {
        from: string
        selectGuests: string
        selectTable: string
        selectAll: string
        deselectAll: string
        selected: string
        cancel: string
        move: string
        addMore: string
        searchTables: string
        noTablesFound: string
      }
      unsavedDialog: {
        title: string
        message: string
        save: string
        discard: string
        cancel: string
      }
      venueElements: {
        title: string
        danceFloor: string
        stage: string
        entrance: string
        bar: string
        djBooth: string
        delete: string
      }
      print: {
        title: string
        guestList: string
      }
      notifications: {
        tableSaved: string
        tableDeleted: string
        guestAssigned: string
        guestMoved: string
        guestRemoved: string
        autoAssigned: string
        layoutSaved: string
        error: string
      }
    }
  }

  // Language switcher
  languageSwitcher: {
    label: string
    en: string
    es: string
  }
}

// Type for translation function
export type TranslationFunction = (key: string, params?: Record<string, string | number>) => string
