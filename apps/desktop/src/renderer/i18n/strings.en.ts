/**
 * VUA UI string table (en) — SOURCE language.
 * - This table is the structural source of truth: the widened Strings type
 *   is derived from it (bottom of file); every other locale table is checked
 *   against it (compile-time via Strings; placeholder parity via
 *   scripts/check-i18n-tables.mjs).
 * - Business code must not hold UI literals; views reference keys from the
 *   current table (models return keys + params) — CJK literals in business
 *   code are rejected by scripts/check-i18n.mjs.
 * - Interpolation uses named placeholders ("{count} remaining"), expanded by
 *   format(); never assemble sentences by concatenation.
 * - Product terms (Warehouse / Recipe / Assembly / Production / Inspection /
 *   Release / AMF) are never translated; terms.* only holds local annotations
 *   (empty in English — the terms are self-explanatory). Reference terms via
 *   {placeholder} + termLabel(), never hardcode them in a sentence.
 * - Demo-data payload copy does not live here; see ./strings.fixtures.zh-CN.ts
 *   (DEV-only, reachable only from gateway fixtures, tree-shaken in release).
 */
export const strings = {
  terms: {
    warehouse: "",
    recipe: "",
    assembly: "",
    production: "",
    inspection: "",
    release: "",
    amf: "",
  },
  common: {
    fixtureBadge: "Demo data",
    mascotAria: "VUA mascot robot",
  },
  boot: {
    loadFailedTitle: "Startup data failed to load",
    loadFailedDescription:
      "Something went wrong while reading local capability snapshots; the interface is not ready yet. Retrying does not modify any local data.",
    retry: "Retry",
  },
  statusLight: {
    ok: "OK",
    warning: "Needs confirmation",
    error: "Needs fixing",
    unknown: "Unknown",
  },
  taskStatus: {
    queued: "Queued",
    preparing: "Preparing",
    running: "Running",
    waitingInput: "Waiting for input",
    paused: "Paused",
    completed: "Completed",
    completedWithWarnings: "Completed with warnings",
    failed: "Failed",
    cancelled: "Cancelled",
  },
  workflowStage: {
    inspect: "Inspecting project state",
    plan: "Generating execution plan",
    await_confirmation: "Waiting for plan confirmation",
    snapshot: "Creating snapshot",
    execute: "Applying changes",
    validate: "Validating results",
    completed: "Completed",
    recover: "Rolling back",
    failed: "Failed",
    failed_recoverable: "Failed (recoverable)",
    expired: "Confirmation expired",
  },
  capability: {
    states: {
      unavailable: "Unavailable",
      unconfigured: "Not configured",
      loading: "Loading",
      ready: "Ready",
      blocked: "Blocked",
      waitingInput: "Waiting for action",
      error: "Error",
    },
    details: {
      detectorsMissing: "Real detectors are not connected yet",
      taskEngineMissing: "Task engine is not connected yet",
      catalogMissing: "Tool catalog is not connected yet",
      packagesEngineMissing: "Package engine is not connected yet",
    },
  },
  taskCenter: {
    title: "Task Center",
    expandAria: "Expand task list, {count} items",
    collapseAria: "Collapse task list",
    runningSummary: "{title} and {count} more",
    idleSummary: "No running tasks",
    backToOrigin: "Back to origin page",
    cancel: "Cancel",
    cancelRejected: "This task cannot be cancelled right now",
demoTaskTitle: "Demo task",
    replay: "Replay event stream",
    progress: "{done}/{total}",
  },
  nav: {
    tabs: {
      home: "Hub",
      env: "Environment",
      guide: "Guide",
      production: "Production",
      tools: "Tools",
      settings: "Settings",
    },
    groups: {
      warehouse: "Warehouse",
      workshop: "Workshop",
      packages: "Packages",
    },
    pages: {
      home: "Hub",
      envPlay: "Play Environment",
      envCreate: "Production Environment",
      guideStart: "Getting Started",
      guideBasics: "Basic Controls",
      guideSafety: "Safety Settings",
      guideDevices: "Device Tips",
      guideTutorials: "Desktop/VR Tutorials",
      toolsDiscover: "Discover Tools",
      toolsDevices: "Devices & Tracking",
      toolsCalibration: "Calibration",
      toolsInstalled: "Installed Tools",
      settingsGoals: "Reset Goals",
      settingsLanguage: "Language",
      settingsTheme: "Theme",
      settingsVersion: "Version",
      settingsAbout: "About",
      settingsDonate: "Donate",
      packages: "Package Manager",
    },
  },
  /** Hub landing page (S-VFX-2): default entry */
  home: {
    tagline: "Your VRChat play & creation command hub",
    commandCta: "Search pages, features, and actions…",
    quickHeading: "Jump in",
    statusHeading: "Environment status",
    cardDesc: {
      env: "Check and repair runtimes with a one-line verdict",
      guide: "A guided path into VRChat from zero",
      production: "From asset intake to recipe assembly and release",
      tools: "Devices, calibration, and utilities",
    },
  },
  app: {
    moduleNavAria: "Modules",
    sidebarAria: "Features",
    themeToLight: "Switch to light theme",
    themeToDark: "Switch to dark theme",
    windowMinimize: "Minimize",
    windowMaximize: "Maximize/Restore",
    windowClose: "Close",
  },
  onboarding: {
    steps: {
      goals: "Choose goals",
      environments: "Refine environments",
      confirm: "Confirm & enter",
      counter: "Step {current} of {total}",
      aria: "Onboarding progress",
    },
    step1Title: "What would you like to do first?",
    step1Description:
      "We will prepare the environments your goals require. You can pick several goals and adjust them later in Settings.",
    recommended: "Recommended",
    skip: "Skip for now",
    back: "Back",
    continue: "Continue",
    goalRequired: "Select at least one goal to continue",
    goals: {
      env: {
        title: "Environment Setup",
        description:
          "Check and prepare the software, space and settings needed to play VRChat or create avatars.",
        impact: "Enables environment checks and the play/production environment status pages.",
      },
      guide: {
        title: "Game Guide",
        description: "Learn to enter VRChat, basic controls, safety settings and device usage.",
        impact: "Enables tutorial pages and learning progress tracking.",
      },
      production: {
        title: "Avatar Production",
        description:
          "Organize assets, create {recipe}, assemble, inspect and prepare avatar releases.",
        impact: "Enables Warehouse, Recipe and Workshop pages.",
      },
      tools: {
        title: "Tool Collection",
        description: "Discover and manage reviewed community tools, device adapters and calibration.",
        impact: "Enables the tool catalog and device entries.",
      },
    },
    step2Title: "Which environments should be prepared?",
    step2Description: "You can select both; their status is computed independently.",
    envRequired: "Select at least one environment to continue",
    environments: {
      play: {
        title: "Play Environment",
        description: "VRChat, a suitable VR runtime or streaming method, network and required settings.",
      },
      create: {
        title: "Production Environment",
        description: "A supported Unity, VPM, disk space and avatar creation dependencies.",
      },
    },
    step3Title: "Confirm your choices",
    selectedGoals: "Selected goals",
    willCheck: "What will be checked",
    willCheckItems:
      "Local environment checks for the environments you selected; other features stay disconnected for now.",
    wontDo: "What will not happen",
    wontDoItems:
      "No system settings are modified, no software is installed, no data is uploaded; you will be asked again before any change.",
    confirm: "Enter VUA",
  },
  deployer: {
    zones: {
      play: {
        title: "Play Environment",
        readyHeadline: "You're ready to play VRChat",
        readyDescription: "All {zone} checks passed. You can move on to the next step.",
        pendingDescription: "Complete the missing items to start; fixes do not affect existing data.",
        emptyDescription:
          "Once environment detectors are connected, VRChat, VR runtime/streaming and network status will be listed here.",
      },
      create: {
        title: "Production Environment",
        readyHeadline: "You're ready to create avatars",
        readyDescription: "All {zone} checks passed. You can move on to the next step.",
        pendingDescription: "Complete the missing items to start creating; fixes do not affect existing data.",
        emptyDescription:
          "Once environment detectors are connected, Unity, VPM and disk space status will be listed here.",
      },
    },
    summary: {
      pending: "{count} items still to prepare",
      empty: "No check items yet",
      emptyDescription: "The data source returned no check items for this zone.",
      ctaEnterNext: "Go to next step",
      ctaFixAll: "Fix all",
      ctaRecheck: "Re-run checks",
    },
    page: {
      notRunTitle: "Environment check not started",
      notRunDescription: "Once checks complete, {zone} readiness will be shown here.",
      notRunCta: "Start checks",
      notRunCtaHint: "Environment detectors arrive in a later milestone",
      checkFailed: "Failed to start checks. Please try again.",
      emptyTitle: "No check results yet",
      runningTitle: "Checking {zone}",
      runningDescription: "Checking this machine item by item; no settings or files are modified.",
      failedTitle: "Checks did not complete",
      failedDescription:
        "This run was interrupted and produced no new conclusion. Retrying does not modify any local data.",
      failedRetry: "Retry checks",
      evidenceNote: "Conclusion based on checks at {time}.",
      staleNote: "Results below are from {time}, for reference only.",
    },
    fix: {
      loading: "Generating fix plan…",
      unavailable: "Fix plans are not connected yet.",
      unknownCheck: "No fix plan is available for this check item.",
      loadFailed: "Failed to generate the fix plan. Please try again.",
      impactTitle: "Impact scope",
      stepsTitle: "Fix steps",
      confirmStart: "Start",
      cancel: "Cancel",
      openPage: "Open page",
      openPageFailed: "Could not invoke the system browser; please copy the link manually.",
      stepDone: "Done, continue",
      confirmCandidate: "Confirm & continue",
      recheckNow: "Re-run checks",
    },
    versions: {
      title: "Versions",
      installed: "Installed",
      latest: "Latest",
      lastChecked: "Last checked",
      notInstalled: "Not installed",
      stateUpToDate: "Up to date",
      stateUpdate: "Update available",
      stateUnknown: "Version unknown",
      justNow: "Just now",
      minutesAgo: "{count} min ago",
      hoursAgo: "{count} hours ago",
      daysAgo: "{count} days ago",
    },
    goalOff: {
      title: "Environment setup goal not selected",
      description:
        "Environment setup was not selected during onboarding. Select the goal to enable environment checks and status conclusions.",
      cta: "Choose environment goals",
    },
    envOff: {
      title: "This environment is not a check target",
      description: "Only {other} is currently selected. To check {zone}, you can re-select your goals.",
      cta: "Re-select goals",
    },
  },
  workshop: {
    title: "Factory Workshop",
    subtitle: "Assembly, production and inspection tasks run here and are recoverable throughout.",
    runningSubtitle: "The assembly plan is confirmed and a snapshot created; you can recover at any time.",
    idleTitle: "Production pipeline not connected yet",
    idleDescription:
      "Once {recipe} and the assembly pipeline are connected, assembly tracks, execution status and snapshot recovery will appear here.",
    blocked: {
      title: "Production environment not ready",
      description:
        "The workshop needs a working Unity and VPM production environment. Once ready, assembly can begin.",
      cta: "Prepare production environment",
    },
    trackAria: "{amf} production stages",
    trackHint:
      "Infeed: {infeed} · Outfeed: {outfeed} — the track only connects the three workshop stages in between (§7.1)",
    logTitle: "Execution log",
    logHint:
      "Node lighting and part movement are driven by real log events (§7.2); the simplified newcomer view never crosses principle ①.",
    conclusion: {
      running: "Pipeline running",
      needsConfirmation: "A checkpoint awaits confirmation",
      blocked: "Pipeline blocked; recover from snapshot after handling",
      completed: "All stages completed",
      notStarted: "Not started yet",
    },
    stageState: {
      completed: "Completed",
      current: "Running",
      pending: "Not started",
      needsConfirmation: "Awaiting confirmation",
      blocked: "Blocked",
    },
    station: {
      title: "Station details",
      currentState: "Current state",
      eventsTitle: "State events",
      noEventsYet: "This station has no state events up to the current moment.",
      livePendingNote: "Once the live event stream is connected, per-station event details will appear here.",
      role: {
        warehouse: "Infeed: assets that arrived locally queue here after inspection, waiting for assembly.",
        recipe: "Recipe slot: the desired-state source of assembly — the recipe decides what gets built and how.",
        assembly: "Assembly station: binds assets onto the base per the recipe, producing a buildable project structure.",
        production: "Production station: runs build and packaging, producing an uploadable artifact.",
        inspection: "Inspection station: checks the artifact; only passing results may ship.",
        release: "Outfeed: artifacts that pass inspection are registered here and move to the release showcase.",
      },
    },
    pipeline: {
      aria: "Production pipeline",
      recipe: "Current recipe",
      workshop: "Workshop",
      release: "Latest release",
    },
    replay: {
      play: "Play",
      pause: "Pause",
      restart: "Restart",
      controlsAria: "Replay controls",
      progressAria: "Replay progress {position} / {duration}",
      operationsLine: "{count} automatic operations completed (verifiable in the log)",
    },
  },
  guide: {
    progressSlotTitle: "Learning goals & progress",
    progressSlotEmpty:
      "Start a tutorial from any page below and this area shows your current goal, progress and “resume last tutorial”.",
    progressSlotActive: "Tutorial in progress: step {index} / {total} — {title}",
    progressSlotCompleted: "Tutorial completed; close or restart it in the tutorial window.",
    progressSlotFailed: "Failed to read tutorial progress.",
    progressSlotRetry: "Retry",
    startTutorialCta: "Learn this page in the tutorial window",
    startTutorialFailed: "Failed to open the tutorial window. Please try again.",
    draftNotice:
      "This page is an early placeholder draft; final tutorial content arrives in a later release (M5).",
    mediaAlt: {
      pcKeys: "PC keyboard diagram highlighting the talk, chat, emoji wheel keys and spacebar",
      vrController: "VR controller diagram highlighting the trigger and grip areas",
    },
    pages: {
      start: {
        title: "Getting Started",
        intro: "The shortest path from install to your first world.",
        sections: [
          {
            id: "prepare",
            title: "Before you start",
            paragraphs: [
              "Make sure your accelerator is on and pinned to the same route, and Steam is signed in. VRChat itself is free.",
            ],
          },
          {
            id: "first-steps",
            title: "What to do first",
            paragraphs: [
              "Follow this page's tutorial through three things: enter the default world, pick a free avatar at a mirror, and learn how to go home.",
            ],
          },
        ],
      },
      basics: {
        title: "Basic Controls",
        intro: "A quick reference for menus, keys and status indicators.",
        sections: [
          {
            id: "menu",
            title: "Where the menus are",
            paragraphs: [
              "The Esc quick menu covers most daily actions; settings live in the main menu.",
            ],
          },
          {
            id: "keys-pc",
            title: "PC key reference",
            media: "pc-keys",
            paragraphs: ["Remember talk, emote and jump keys first; look up the rest when needed."],
          },
          {
            id: "keys-vr",
            title: "VR controller reference",
            media: "vr-controller",
            paragraphs: [
              "Mic and jump are most used; grabbing comes in front-trigger and side-grip variants.",
            ],
          },
        ],
      },
      safety: {
        title: "Safety Settings",
        intro: "Spend two minutes on these settings before entering crowded worlds.",
        sections: [
          {
            id: "open-urls",
            title: "Allow untrusted URLs",
            paragraphs: [
              "Without this toggle, many worlds' videos, images and music will fail to load.",
            ],
          },
          {
            id: "personal-space",
            title: "Personal space & portal confirmation",
            paragraphs: [
              "Strangers who get too close are hidden automatically; entering someone else's portal asks for confirmation first.",
            ],
          },
          {
            id: "trust",
            title: "Trust ranks & avatar shield",
            paragraphs: [
              "Shield levels decide whose avatars and effects you see; you can hide anyone with one click if uncomfortable.",
            ],
          },
        ],
      },
      devices: {
        title: "Device Tips",
        intro: "Differences between PC, VR and mobile, plus settings for a smoother picture.",
        sections: [
          {
            id: "platforms",
            title: "What each platform can play",
            paragraphs: [
              "All platforms play together; avatars and worlds mark platform compatibility — watch for the green available badge.",
            ],
          },
          {
            id: "tracking",
            title: "Tracking & IK",
            paragraphs: [
              "Without trackers the game estimates poses with IK; occasional clipping while sitting is normal.",
            ],
          },
          {
            id: "performance",
            title: "Graphics & performance",
            paragraphs: [
              "For stutter, first lower avatar display count and shadows; VRAM-heavy avatars can be limited.",
            ],
          },
        ],
      },
      tutorials: {
        title: "Desktop/VR Tutorials",
        intro: "The same tutorial runs in sync on the desktop window and the VR overlay.",
        sections: [
          {
            id: "surfaces",
            title: "Dual-surface sync",
            paragraphs: [
              "Turn a page on either side and the other follows instantly; closing the VR overlay falls back to the desktop window.",
            ],
          },
          {
            id: "accounts",
            title: "About accounts",
            paragraphs: [
              "Steam guest-account data cannot be migrated; register on the official site and link it to keep favorites and friends long-term.",
            ],
          },
        ],
      },
    },
  },
  tools: {
    notConnectedTitle: "Tool catalog not connected yet",
    cardFieldsNote:
      "Every connected tool declares: what problem it solves, whether it is installed, where data is sent, and who maintains it.",
    groups: {
      devices: "Devices & Tracking",
      calibration: "Space Calibration",
      capture: "Capture & Input",
    },
    fields: {
      purpose: "What it solves",
      installed: "Installed?",
      dataDestination: "Data destination",
      maintainer: "Maintainer",
    },
    installedYes: "Installed",
    installedNo: "Not installed",
    openHomepage: "Open website",
    openHomepageImpact:
      "Opens the official website in the system browser; in-app launch and config import arrive in a later slice.",
    openHomepageFailed: "Failed to open. Check your system browser settings and retry.",
    groupEmpty: "No tools in this group yet.",
    installedEmpty: "No installed tools yet.",
    pages: {
      discover: {
        title: "Discover Tools",
        description: "A catalog of reviewed community tools arrives in a later milestone.",
      },
      devices: {
        title: "Devices & Tracking",
        description: "Adapter entries for headsets, controllers and trackers arrive in a later milestone.",
      },
      calibration: {
        title: "Calibration",
        description: "Space and tracking calibration entries arrive in a later milestone.",
      },
      installed: {
        title: "Installed Tools",
        description: "Management and updates for installed tools arrive in a later milestone.",
      },
    },
  },
  warehouse: {
    subtitle:
      "The product catalog and assets arriving on this machine meet here; purchases and downloads always happen in the system browser or official tools.",
    searchPlaceholder: "Search title or product ID",
    searchAria: "Search catalog products",
    filters: {
      availability: "Availability",
      entityType: "Entity type",
      relationKind: "Relation",
      allAvailability: "All availability",
      allEntityTypes: "All entity types",
      allRelationKinds: "All relations",
    },
    resultCount: "Showing {shown} of {total}",
    resultCountAll: "{total} products",
    availability: {
      available: "Available",
      unavailable: "Discontinued",
      unknown: "Unknown",
      deleted: "Tombstone",
    },
    relationKind: {
      compatible_with: "Compatible",
      addon_for: "Add-on for",
      requires: "Requires",
    },
    entityType: {
      avatar: "Base avatar",
      outfit: "Outfit",
      texture: "Texture",
      hair: "Hair",
      accessory: "Accessory",
      prop: "Prop",
      shader: "Shader",
      animation: "Animation",
      tool: "Tool",
      other: "Other",
    },
    album: {
      prevImage: "Previous",
      nextImage: "Next",
      zoomImage: "Zoom in",
      closeZoom: "Close zoom view",
    },
    card: {
      detailsCta: "View details",
      markPurchased: "Mark as purchased",
      unmarkPurchased: "Remove purchased mark",
      purchasedBadge: "Purchased",
      free: "Free",
      price: "{currency} {amount}",
      noPrice: "No price info",
      noImage: "No image yet",
      entityCount: "{count} entities",
    },
    detail: {
      panelAria: "Product details",
      close: "Close",
      closeAria: "Close product details",
      notFound: "Product not found. It may have been removed from the catalog, or local data needs an update.",
      loadFailed: "Failed to load details.",
      tombstoneNote:
        "This product has been deleted (tombstone). The catalog keeps only its last title and main image for tracing existing references.",
      entitiesTitle: "Entities & relations",
      entitiesEmpty: "No entities have been resolved for this product yet.",
      attributionTitle: "Shop & creator",
      termsTitle: "Tags",
      descriptionTitle: "Description",
      sourceTitle: "Source",
      openSource: "Open source page in browser",
      openSourceFailed: "Could not invoke the system browser; please copy the link above manually.",
      openInApp: "Open in app window",
      openInAppFailed: "Could not open the in-app window; use the system browser instead.",
      sourceUrlNote:
        "Sign-in, purchase and download happen on the source page or the official BOOTH Library Manager; once files arrive, {warehouse} scans and takes over.",
      retry: "Retry",
      preview3dTitle: "3D preview",
      preview3dNote: "Real-time VRM preview is planned: models that arrive locally will be rotatable here.",
      debugTitle: "Debug info",
    },
    acquire: {
      viewCatalog: "Catalog",
      viewLocal: "Local assets",
      viewSwitchAria: "Switch catalog / local assets view",
      trackCatalogDesc: "Cloud catalog snapshot; purchase and download always finish on the source page or official tools",
      trackLocalDesc: "Local asset gallery from your scan folders; arriving assets are inspected before use",
      scanTitle: "Scan folders",
      scanEmpty:
        "No scan folder specified yet. Once specified, newly arrived assets are inspected before use.",
      artifactsTitle: "Arrived assets",
      artifactsEmpty: "No assets have arrived yet.",
      previewEmpty: "Preview images not extracted yet",
      sizeUnknown: "Size unknown",
      sizeB: "{amount} B",
      sizeKb: "{amount} KB",
      sizeMb: "{amount} MB",
      sizeGb: "{amount} GB",
      verdict: {
        pending: "Pending inspection",
        clean: "No executables found",
        quarantined: "Quarantined",
      },
      executablesTitle: "Executable content detected",
      neverRunNote:
        "Executable content inside archives is never run automatically; quarantined assets cannot be referenced by {recipe}.",
      pendingNote: "Until inspection completes, this asset cannot be referenced by {recipe}.",
      states: {
        notConnectedTitle: "Local asset gallery not connected yet",
        notConnectedDescription:
          "Once the capability is connected, previews and inspection results of assets arriving in your scan folders will appear here as a gallery.",
      },
    },
    states: {
      notConnectedTitle: "Catalog not connected yet",
      notConnectedDescription:
        "Once the catalog capability is connected, a browsable, searchable product catalog will appear here.",
      loadFailedTitle: "Failed to load catalog",
      loadFailedDescription: "Something went wrong reading catalog data. Retrying does not modify any local data.",
      retry: "Retry",
      emptyResultTitle: "No matching products",
      emptyResultDescription: "Try a different search term or loosen the filters.",
    },
  },
  tutorial: {
    surfaceTitle: "Tutorial",
    progress: "Step {index} / {total}",
    next: "Next",
    back: "Back",
    dismiss: "Close tutorial",
    openOnDesktop: "View on desktop",
    vrDevEntry: "VR tutorial (dev verification)",
    vrDevReset: "Reset VR helper (dev diagnostics)",
    topmostOn: "Unpin window from top",
    topmostOff: "Pin window on top",
    completedTitle: "Tutorial completed",
    completedBody: "The demo session has finished. Closing the window ends this tutorial.",
    inactiveTitle: "No tutorial in progress",
    inactiveBody:
      "Start the desktop tutorial window from the guide page in the main window, and tutorial steps will appear here.",
    loadErrorTitle: "Cannot reach the app layer right now",
    loadErrorBody:
      "The tutorial snapshot request failed or timed out. Retrying does not affect the main window; closing this window does not end the tutorial session there either.",
    retry: "Retry",
    closeWindow: "Close window",
    steps: {
      "demo-welcome": {
        title: "Welcome to the VUA tutorial",
        body: "This is a demo session running on desktop and VR together, verifying the dual-surface sync pipeline.",
      },
      "demo-controls": {
        title: "Four semantic actions",
        body: "Back, next, close, view on desktop — the VR tutorial surface only ever sends these four actions.",
      },
      "demo-recap": {
        title: "Session state sync",
        body: "The desktop window and VR tutorial see the same session; act on either side and the other follows instantly.",
      },
      "start-prepare": {
        title: "Before you start",
        body: "Make sure your accelerator is on and pinned to the lowest-latency route, and Steam is signed in.",
      },
      "start-first-world": {
        title: "Enter your first world",
        body: "Your first entry lands in the default world. At a mirror you can pick an avatar you like from the free ones.",
      },
      "start-find-content": {
        title: "Find more content",
        body: "The Worlds page of the main menu lets you search and favorite worlds; set a frequently visited world as home to arrive there directly.",
      },
      "basics-menu": {
        title: "Where the menus are",
        body: "On PC press Esc for the quick menu and double-click the gear for the main menu; in VR press Y or B to open the menu.",
      },
      "basics-keys-pc": {
        title: "Common PC keys",
        body: "Hold V to talk, Y opens chat input, R opens the emoji wheel, Space jumps, C crouches, Z lies down.",
      },
      "basics-keys-vr": {
        title: "Common VR buttons",
        body: "Hold X to toggle the mic, A jumps, the front trigger confirms and grabs, the side grip grabs objects.",
      },
      "basics-status": {
        title: "What status colors mean",
        body: "Green = online, blue = in a group, yellow = busy, red = do not disturb. Your status shows on your nameplate.",
      },
      "safety-open-urls": {
        title: "Turn this switch on first",
        body: "Enable “Allow untrusted URLs” in Settings → Comfort & Safety, otherwise many worlds' videos and images will not load.",
      },
      "safety-personal-space": {
        title: "Personal space & portals",
        body: "With personal space on, strangers who get too close are hidden automatically; entering a portal someone dropped asks for confirmation first.",
      },
      "safety-trust": {
        title: "Trust ranks & shields",
        body: "Shield levels decide whose avatars and effects you see. If uncomfortable, hide someone's avatar with one click in the quick menu.",
      },
      "safety-audio": {
        title: "When you can't hear clearly",
        body: "Check input/output devices in Settings → Audio; video volume in worlds can be adjusted on each player.",
      },
      "devices-platforms": {
        title: "What each platform can play",
        body: "PC, VR and mobile play together; avatars and worlds mark platform compatibility — a green badge means available on your current platform.",
      },
      "devices-tracking": {
        title: "Tracking & IK",
        body: "Hip and leg trackers greatly improve expressiveness; without them the game estimates poses with IK and clipping is normal.",
      },
      "devices-performance": {
        title: "Graphics & performance",
        body: "For stutter, first lower “avatar display count” and shadows; VRAM-heavy avatars can be limited in safety settings.",
      },
      "tutorials-surfaces": {
        title: "Desktop & VR dual surfaces",
        body: "The same tutorial runs in sync in the desktop window and the VR overlay; turn a page on either side and the other follows instantly.",
      },
      "tutorials-faq": {
        title: "Quick FAQ",
        body: "An avatar not showing is usually a shield level or platform compatibility issue; check the accelerator first when disconnected; see each guide page for more.",
      },
      "tutorials-accounts": {
        title: "About accounts",
        body: "Steam guest-account data cannot be migrated; register a full account on the official site and link it to keep favorites and friends long-term.",
      },
    },
  },
  media: {
    loadFailed: "Image failed to load",
    retry: "Retry",
    loading: "Image loading",
  },
  recipe: {
    loadFailed: "Failed to load the recipe graph.",
    loadFailedDescription: "Something went wrong reading recipe data. Retrying does not modify any local data.",
    retry: "Retry",
    notConnectedTitle: "Recipe graph not connected yet",
    notConnectedDescription: "Once recipe data is connected, a multi-layer relation graph will appear here.",
    viewGraph: "Graph",
    viewList: "List",
    viewExploded: "Exploded",
    viewSwitchAria: "Switch graph / list / exploded view",
    /** S-IX-5 exploded view: semantic layers lifted in 3D, read-only; drag stays in graph view */
    explodedHint: "Exploded view lifts the recipe into its semantic layers; dragging is disabled here — switch back to Graph to adjust the layout.",
    layers: {
      body: "Body & base avatars",
      outfit: "Outfits & accessories",
      animation: "Animations & menus",
      tech: "Shaders & dependencies",
    },
    nodeStates: {
      ready: "Ready",
      conflict: "Conflict",
      missing: "Missing locally",
      unresolved: "Unresolved",
    },
    edgeKinds: {
      composition: "Composed of",
      wardrobe: "Wardrobe option",
      dependency: "Dependency",
    },
    conflictsTitle: "Conflicts",
    missingTitle: "Locally missing assets",
    detailTitle: "Selected node",
    detailEmpty: "Click a node to see details.",
    legendAria: "Legend",
    moveHint:
      "Drag nodes to pin them in place; drag empty space to pan and scroll to zoom. When a node is selected you can also nudge it with arrow keys or the buttons below. The layout is saved automatically on this machine.",
    moveGroupAria: "Move selected node",
    moveUp: "Move up",
    moveDown: "Move down",
    moveLeft: "Move left",
    moveRight: "Move right",
    resetLayout: "Restore auto layout",
    /** S-X-3 radial canvas: reset pan/zoom (does not touch node layout) */
    resetView: "Reset view",
    /** S-IX-4 recipe version manager: local snapshots of layout + structure summary */
    versions: {
      toggle: "Versions",
      title: "Version manager",
      saveCta: "Save current as new version",
      notePlaceholder: "Note (optional)",
      noteAria: "Version note",
      currentBadge: "Current",
      restore: "Restore",
      remove: "Delete",
      empty: "No version snapshots yet.",
      metaLine: "{nodes} nodes · {missing} missing",
      scopeNote: "Versions currently record layout and a structure summary; recipe content editing and share codes join the version history once connected.",
      seedNoteBase: "Demo: auto layout baseline",
      seedNoteCustom: "Demo: custom layout snapshot",
    },
    /** Graph node context menu (S-XII): real actions only, no placeholders */
    contextMenu: {
      viewDetails: "View details",
      deselect: "Deselect",
      resetPosition: "Reset to auto layout",
    },
  },
  release: {
    loadFailed: "Failed to load release projects.",
    loadFailedDescription: "Something went wrong reading release project data. Retrying does not modify any local data.",
    retry: "Retry",
    notConnectedTitle: "Release projects not connected yet",
    notConnectedDescription:
      "After a production pipeline completes, project cards you can keep editing, roll back and hand over for upload will appear here.",
    emptyTitle: "No release projects yet",
    emptyDescription: "After a production pipeline completes, the project will appear here.",
    previewPlaceholder: "Preview not generated yet",
    bakePreviewTitle: "Unity bake preview",
    bakePreviewFailed: "Bake output not found — run build_preview in Unity first.",
    detailTitle: "Project details",
    detailEmpty: "Click a project card to see details.",
    health: {
      healthy: "Matches recipe",
      drifted: "Drifted from recipe",
      "missing-deps": "Missing dependencies",
    },
    inspection: {
      passed: "Inspection passed",
      failed: "Inspection failed",
      none: "Not inspected yet",
    },
    snapshotsLine: "{count} snapshots",
    metaUnity: "Unity",
    metaPlatforms: "Platforms",
    metaRecipe: "Source recipe",
    metaUpdatedAt: "Last updated",
    conveyor: {
      aria: "Release project conveyor",
      prev: "Previous project",
      next: "Next project",
    },
    /** Project card context menu (S-XII): restore/re-derive/upload handoff not wired, no dead buttons */
    contextMenu: {
      viewDetails: "View details",
      collapse: "Collapse details",
    },
    pedestalNote: "Preview extraction is not wired up yet: the artifact on the pedestal is a symbolic render, not the real model.",
    futureNote:
      "Snapshot restore, re-derivation and upload handover arrive in later slices; sign-in and upload always happen in the official VRChat SDK, done by you.",
  },
  /**
   * 包管理(S-XVI):Recipe 之外的手动 VPM 操作面。
   * 玩家语言,不暴露 semver 范围语法/仓库协议细节;版本状态词表
   * (states/sources)与端口类型一一对应,词表外取值由模型层回落,不猜测。
   */
  packages: {
    subtitle:
      "Manually install, update and remove packages for each Unity project; assembling from a {recipe} remains the main path.",
    sections: {
      packages: "Packages",
      repos: "Repositories",
      switchAria: "Switch between packages and repositories",
    },
    toolbar: {
      searchPlaceholder: "Search name or package ID",
      searchAria: "Search packages",
      sourceFilterAria: "Filter by source",
      allSources: "All sources",
      importLocal: "Import local package",
      showPrereleases: "Show pre-releases",
      prereleaseTitle: "Show pre-release versions?",
      prereleaseBody:
        "Pre-releases are early builds shared by their authors and may be unstable. Install one only when you are comfortable troubleshooting it.",
      prereleaseConfirm: "Show pre-releases",
      prereleaseCancel: "Keep hidden",
    },
    columns: {
      selectAll: "Select all listed packages",
      selectRow: "Select {name}",
      name: "Package",
      installed: "Installed",
      latest: "Latest",
      source: "Source",
      rowMenuAria: "More actions for {name}",
      versionSelectAria: "Choose a version for {name}",
      versionPlaceholder: "Choose version…",
      compatibleGroup: "Compatible versions",
      incompatibleGroup: "Incompatible with this project",
    },
    sources: {
      official: "Official",
      curated: "Curated",
      community: "Community",
      local: "Local import",
    },
    states: {
      notInstalled: "Not installed",
      upToDate: "Up to date",
      updateAvailable: "Update available",
      yanked: "withdrawn",
      prerelease: "pre-release",
      versionSuffix: "{version} ({suffix})",
    },
    projects: {
      selectorAria: "Choose project",
      addProject: "Add project folder",
      invalidLine: "{name}: {reason}",
      invalidReasons: {
        folderMissing: "Folder not found; it may have been moved or deleted.",
        unknown: "This project cannot be used right now.",
      },
    },
    migration: {
      summaries: {
        vpmProject:
          "This project looks managed by VCC / vpm. VUA can adopt its package list without touching any files.",
      },
      note: "Migration runs once the package engine is connected; nothing changes automatically.",
    },
    changes: {
      title: "Confirm changes",
      cancel: "Cancel",
      confirm: "Apply changes",
      delayedHint: "Review the list above; confirmation unlocks in a moment.",
      kinds: {
        install: "Install",
        upgrade: "Update",
        majorUpgrade: "Major update",
        downgrade: "Downgrade",
        remove: "Remove",
        reinstall: "Reinstall",
      },
      versionLine: "{from} → {to}",
      majorUpgradeWarning:
        "Major updates can change behavior; check the changelog before applying.",
      downgradeWarning: "Downgrading may break content that relies on newer versions.",
      conflictsTitle: "Conflicts",
      conflicts: {
        requiredBy: "{package} is required by {dependent}; removing it may break that package.",
        unknown: "These packages conflict; review them before applying.",
      },
      legacyTitle: "Legacy folders that will be removed",
    },
    repos: {
      addCommunity: "Add community repository",
      riskTitle: "Before adding a community repository",
      riskBody:
        "Community repositories are maintained by third parties and are not reviewed by VRChat or VUA; packages in them can change after you subscribe. Only add repositories from authors you trust. Subscribing arrives together with the package engine — this notice is shown ahead of time.",
      riskAcknowledge: "Got it",
      toggleAria: "Enable or disable {name}",
      health: {
        unknown: "Not checked",
        ok: "Reachable",
        stale: "May be outdated",
        unreachable: "Unreachable",
      },
      neverChecked: "Never checked",
      checkedJustNow: "Checked just now",
      checkedMinutesAgo: "Checked {count} min ago",
      checkedHoursAgo: "Checked {count} hours ago",
      checkedDaysAgo: "Checked {count} days ago",
      packageCount: "{count} packages",
    },
    empty: {
      engineTitle: "Package management is not connected yet",
      notConnectedTitle: "Package data is not connected yet",
      notConnectedDescription:
        "Once the package engine is connected, your projects, packages and repository subscriptions will appear here.",
      noProjectsTitle: "No projects yet",
      noProjectsDescription:
        "Add an existing Unity project folder to manage its packages here.",
      noSelectionTitle: "No project selected",
      noSelectionDescription: "Choose a project above to see its packages.",
      noPackagesTitle: "No packages in this project",
      noPackagesDescription:
        "Import a local package here, or assemble the project from a {recipe}.",
      noResultTitle: "No matching packages",
      noResultDescription: "Try a different search term or loosen the source filter.",
    },
    drawer: {
      aria: "Package details",
      close: "Close",
      closeAria: "Close package details",
      descriptionHeading: "Description",
      factsHeading: "Facts",
      installedLabel: "Installed version",
      latestLabel: "Latest version",
      sourceLabel: "Source",
      idLabel: "Package ID",
      changelogCta: "Open changelog",
      changelogFailed: "Could not invoke the system browser; please copy the link manually.",
    },
    bulk: {
      selectedCount: "{count} selected",
      updateAll: "Update all",
      installAll: "Install all",
      removeAll: "Remove selected",
      clear: "Clear selection",
    },
    menu: {
      viewDetails: "View details",
      updateToLatest: "Update to latest",
      installLatest: "Install latest",
      remove: "Remove",
      updateUnavailableReason: "Only packages with an update available can be updated",
      removeUnavailableReason: "Only installed packages can be removed",
    },
    toasts: {
      importAdded: "Local package imported.",
      projectAdded: "Project folder added.",
      nothingToChange: "Nothing to change for the current selection.",
      previewUnavailable: "Change preview is unavailable; the package engine is not connected.",
      applyFailed: "Changes could not be applied; the package engine is not connected.",
      appliedSummary: "Applied {count} changes.",
    },
  },
  commandPalette: {
    cta: "Commands",
    ctaHint: "Ctrl+P",
    aria: "Command palette",
    placeholder: "Jump to a page or run a command…",
    empty: "No matching commands.",
    groupPages: "Pages",
    groupActions: "Actions",
    toggleThemeToLight: "Switch to light theme",
    toggleThemeToDark: "Switch to dark theme",
  },
  placeholders: {
    notOpenTitle: "Not available yet",
    recipeDescription: "Recipe composition and the multi-layer relation graph arrive in a later milestone.",
    releaseDescription: "Release and delivery arrive in a later milestone.",
    donateDescription: "Donation channels open before the official release. Thank you for your support.",
    packagesDescription: "Package install, update, migration and backup for Unity projects arrive in a later milestone. Interaction borrows from ALCOM and VCC, repackaged for beginners.",
  },
  productionIntro: {
    title: "Avatar Production",
    subtitle: "Preparing the workbench…",
    skip: "Skip",
  },
  settings: {
    goals: {
      heading: "Reset Goals",
      description: "Re-run the first-launch goal selection. Current choices are kept until you confirm.",
      restartCta: "Re-select goals",
    },
    theme: {
      appearanceHeading: "Appearance",
      appearanceAria: "Appearance theme",
      dark: "Dark",
      light: "Light",
      hcHeading: "High contrast",
      hcDescription:
        "Follow system: activates when Windows high contrast is on. Always on: uses a high-contrast palette in-app, independent of system settings.",
      hcAria: "High contrast mode",
      hcAuto: "Follow system",
      hcOn: "Always on",
      saverHeading: "Resource saver",
      saverDescription:
        "Turns off all interface motion, glow effects and the 3D backdrop to free system resources while you play in VR. Functionality and status cues are unaffected.",
      saverTurnOn: "Turn on resource saver",
      saverTurnOff: "Turn off resource saver",
      saverStateOff: "Currently off",
      saverStateManual: "Currently on (manual)",
      saverStateAuto: "Currently on (auto: SteamVR running)",
      saverAutoLabel: "Turn on automatically while SteamVR is running",
      saverAutoAria: "Auto-enable resource saver while SteamVR is running",
      saverAutoNote:
        "Runtime detection is not connected yet; this preference takes effect automatically once it is connected.",
    },
    language: {
      heading: "Interface language",
      description: "Switching reloads the UI immediately. More translations are in progress.",
      aria: "Interface language",
      pending: "translating",
    },
    version: {
      heading: "VUA Desktop",
      versionLine: "v0.3.0 · Early preview",
      description:
        "Current slice: four-goal information architecture, first-run onboarding, and deployer/workshop shells. Environment checks, asset warehousing and the production pipeline arrive in later milestones.",
      debugHeading: "Debug mode",
      debugDescription:
        "When enabled, warehouse product details show full structured data (including entity UUIDs) for troubleshooting data issues. Display only; nothing is modified.",
      debugToggle: "Show product debug info",
      diagnosticsHeading: "Diagnostics export",
      diagnosticsDescription:
        "Export a redacted diagnostics bundle for troubleshooting. Contains only: app version, data source, environment check states with timestamps, and your goal selection. Never contains: file paths, asset or recipe content, account or device identifiers.",
      diagnosticsExport: "Export diagnostics",
      diagnosticsFailed: "Export failed. Please try again.",
    },
    about: {
      heading: "VRC Ultra Assistant",
      description:
        "An all-in-one assistant for VRChat players and creators: play/production environment deployer and the {amf} avatar pipeline.",
      bannerSlot: "Banner slot: the banner lands here once the mascot is finalized.",
      contributorsHeading: "Contributors & source",
      contributorsDescription:
        "VUA is open source — contributions of code, docs and community skins are welcome; see CONTRIBUTING and AGENTS in the repository.",
      repoCta: "Open project repository",
      repoImpact: "Opens the GitHub repository page in the system browser.",
      repoFailed: "Failed to open. Check your system browser settings and retry.",
    },
  },
  dev: {
    tag: "DEV",
    aria: "Dev scenario switch",
    demoMixed: "Demo · mixed",
    demoAllGreen: "Demo · all green",
    demoWorkshop: "Demo · workshop",
    demoWorkshopWarning: "Demo · workshop pending",
    demoWorkshopBlocked: "Demo · workshop blocked",
    demoWorkshopRecover: "Demo · workshop recover",
    demoTasks: "Demo · tasks",
    demoEnvFresh: "Demo · env unchecked",
    demoEnvFail: "Demo · check failed",
    demoAcquireScan: "Demo · empty local gallery",
    demoPackages: "Demo · packages",
    notRun: "Honest empty state",
    perfProbe: {
      title: "Performance sampling",
      longTasks: "{count} long tasks",
      measures: "Recent measures",
      empty: "No samples yet",
    },
  },
  /** 预览实验室(DEV spike ?dev=preview-lab):T1 webview 直渲素材 / T2 Unity 烘焙成品对照 */
  previewLab: {
    title: "Preview lab",
    subtitle:
      "DEV spike: T1 webview-rendered source materials vs T2 Unity-baked product; project data is read from the local demo manifest and never committed to the repo.",
    needRootTitle: "No demo project specified",
    needRootBody:
      "Append &demoRoot=<Unity project path> to the URL; the page reads .vrcua/bridge/demo-lab.json from that project.",
    demoRootLabel: "Project",
    manifestLoading: "Reading demo manifest…",
    manifestFailedTitle: "Demo manifest unavailable",
    manifestFailedBody:
      "Could not read {path}. Check demoRoot and that .vrcua/bridge/demo-lab.json exists in the project.",
    sourcesTitle: "Materials · T1 direct webview render",
    sourcesNote:
      "Unity custom shaders are approximated with the base material plus its main texture; FBX-embedded textures are kept. Lighting and shading differ from the Unity bake.",
    productsTitle: "Products · T2 Unity editor bake",
    productsNote:
      "Turntable frames are baked by the Unity editor bridge into .vrcua/bridge/preview/; the VRM is rendered directly by the webview as a control.",
    cardStatusLoading: "Loading…",
    cardStatusFailed: "Load failed",
    bakePending: "Bake output not found — run build_preview in Unity first ({path}).",
    bakedMeta: "{frames} frames · {width}×{height} · {triangles} tris",
    loadingFrames: "Loading frames {loaded}/{total}…",
    dragHint: "Drag to rotate",
    kindFbx: "FBX source",
    kindVrm: "VRM export",
    kindTurntable: "Unity bake",
  },
  showcase: {
    title: "Component state showcase",
    subtitle: "Dev walkthrough page: interaction states are force-rendered; values reference tokens only, no new visual values.",
    motionNormal: "Normal motion",
    motionReduced: "Simulated reduced motion",
    themeDark: "Dark theme",
    themeLight: "Light theme",
    districtPurple: "VUA purple district (default)",
    districtOrange: "{amf} orange district (avatar production)",
    themeHc: "High contrast (manual preview)",
    loadingNote: "See the skeleton section for loading; buttons have no separate loading state.",
    sections: {
      button: "Button",
      badge: "Badge",
      card: "Card",
      texture: "Control texture (v0.4.0 §3.6)",
      statusLight: "StatusLight",
      emptyState: "EmptyState",
      mascot: "Mascot",
      skeleton: "Skeleton",
      mediaSlot: "MediaSlot",
      navSelected: "Nav selected state",
      capability: "Capability states",
    },
    states: {
      default: "Default",
      hover: "Hover",
      pressed: "Pressed",
      focused: "Focused",
      selected: "Selected",
      disabled: "Disabled",
      loading: "Loading",
      ready: "Ready",
      failed: "Failed",
    },
    badgeTones: {
      neutral: "Neutral",
      brand: "Brand",
      success: "Success",
      warning: "Warning",
      error: "Error",
    },
    demo: {
      buttonLabel: "Action",
      cardBody: "Sample card content; hover lifts with a district-colored border.",
      emptyTitle: "Not connected",
      emptyDescription: "Sample empty-state copy for showcase walkthroughs.",
      navTab: "Top tab",
      navSidebar: "Sidebar item",
    },
    textureDemo: {
      panel: "Glass panel: hairline border · translucent · backdrop blur",
      panelBody: "Cards and panels layer via hairline borders and glass, letting the canvas aurora glow through.",
      elevated: "Elevated overlay: glow shadow",
      elevatedBody: "Overlays keep a dual shadow: ambient light plus an accent-colored glow; hover lifts and blooms.",
      input: "Input: 6px radius",
      inputPlaceholder: "Input placeholder text",
    },
  },
  wizard: {
    wrongStep: "Current step is {current}; cannot submit {submitted}",
    onlyReview: "Execution can only start from the review page",
    noProject: "No project selected yet",
    required: "{label} is required",
    labels: {
      outfit: "Outfit",
      outfitArmature: "Outfit Armature",
      toggleName: "Toggle name",
      workflowId: "Workflow ID",
    },
  },
};

/**
 * Widening (C-I18N): literal types of the source table → string, so other
 * locale tables can be assigned to the same shape. The key structure is still
 * enforced by the mapped type (missing/extra keys fail compilation);
 * placeholder parity is verified by scripts/check-i18n-tables.mjs.
 */
type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly Widen<U>[]
    : { [K in keyof T]: Widen<T[K]> };

export type Strings = Widen<typeof strings>;
