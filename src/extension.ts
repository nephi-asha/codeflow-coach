// Author: Nephi Ulimuke-Ebegim Asha 😏🙂

import * as vscode from 'vscode';

// Defining keys for global state
const DISMISSED_TIPS_KEY = 'codeflowCoach.dismissedTips';
const LAST_TIP_TIME_KEY = 'codeflowCoach.lastTipShownTime'; 

interface Tip {
    id: string;
    message: string;
    actionLabel?: string;
    actionCommand?: string;
    frequency?: 'always' | 'once' | 'onFirstTrigger' | 'rateLimited'; // 'rateLimited' for tips that can reappear
    minDelayMinutes?: number; // Minimum delay before a 'rateLimited' tip can show again
    trigger: 'onSave' | 'onType' | 'onInterval' | 'onCommand';
    condition?: (document: vscode.TextDocument) => boolean; // Condition for onType/onSave
    languageSpecific?: boolean; // Hint for smarter selection
    priority?: number; // Higher number means higher priority 
    lastShown?: number; // Timestamp of when this specific tip was last shown (runtime, not persisted)
}

const allTips: Tip[] = [
    // Core Tips (Keep these)
    {
        id: 'fileSaveShortcut',
        message: 'Pro-Tip: Use `Ctrl+S` (or `Cmd+S`) to quickly save your file!🫡',
        actionLabel: 'Don\'t show again',
        frequency: 'once',
        trigger: 'onSave',
        condition: (document) => document.isDirty,
        priority: 5
    },
    {
        id: 'commandPalette',
        message: 'Pro-Tip: `Ctrl+Shift+P` (or `Cmd+Shift+P`) opens the Command Palette for quick access to all VS Code features!🤓',
        actionLabel: 'Got it!',
        frequency: 'once',
        trigger: 'onType',
        condition: (document) => document.languageId === 'plaintext' || document.languageId === 'markdown' || document.languageId === 'json',
        priority: 4
    },
    {
        id: 'multiCursor',
        message: 'Pro-Tip: Hold `Alt` and click (or `Option` on macOS) to add multiple cursors for quick parallel edits!🤓',
        actionLabel: 'Tell me more',
        actionCommand: 'https://code.visualstudio.com/docs/editor/codebasics#_multiple-selections-multi-cursor',
        frequency: 'once',
        trigger: 'onType', // Changed to onType for more direct relevance
        condition: (document) => true,
        priority: 4
    },

    // Ergonomics Reminders
    {
        id: 'ergonomicsBreak1',
        message: 'Codeflow Coach: Time for a quick break! Stretch, look away, or grab water.',
        actionLabel: 'Take a Micro-Break Now',
        frequency: 'always',
        trigger: 'onInterval',
        priority: 1 // Lower priority for display purposes, but interval-driven
    },
    {
        id: 'ergonomicsBreak2',
        message: 'Codeflow Coach: Short break reminder! Give your eyes a rest from the screen.',
        actionLabel: 'Take a Micro-Break Now',
        frequency: 'always',
        trigger: 'onInterval',
        priority: 1
    },
    {
        id: 'ergonomicsBreak3',
        message: 'Codeflow Coach: Stand up and stretch! A quick physical break can boost focus.',
        actionLabel: 'Take a Micro-Break Now',
        frequency: 'always',
        trigger: 'onInterval',
        priority: 1
    },

    // NEW TIPS: Navigation & Search 🙂
    {
        id: 'gotoFile',
        message: 'Pro-Tip: `Ctrl+P` (or `Cmd+P`) quickly opens files by name from your workspace. Try it!',
        actionLabel: 'Learn more',
        actionCommand: 'https://code.visual튜디오.com/docs/editor/codebasics#_go-to-file',
        frequency: 'once',
        trigger: 'onType',
        condition: (document) => true, // Show generally
        priority: 4
    },
    {
        id: 'findEverywhere',
        message: 'Pro-Tip: `Ctrl+Shift+F` (or `Cmd+Shift+F`) searches across all files in your workspace. Very powerful!',
        actionLabel: 'Got it!',
        frequency: 'once',
        trigger: 'onSave',
        condition: (document) => true,
        priority: 3
    },
    {
        id: 'peekDefinition',
        message: 'Pro-Tip: Right-click on a variable/function and select "Peek Definition" (`Alt+F12` / `Option+F12`) to see its source without leaving your current file!',
        actionLabel: 'Show me!',
        actionCommand: 'https://code.visualstudio.com/docs/editor/editingevolved#_peek',
        frequency: 'once',
        trigger: 'onType',
        condition: (document) => ['typescript', 'javascript', 'python', 'csharp', 'java'].includes(document.languageId),
        languageSpecific: true,
        priority: 5
    },
    {
        id: 'goToFileSymbol',
        message: 'Pro-Tip: `Ctrl+Shift+O` (or `Cmd+Shift+O`) lets you quickly navigate to symbols (functions, classes) within the current file!',
        actionLabel: 'Got it!',
        frequency: 'once',
        trigger: 'onType',
        condition: (document) => ['typescript', 'javascript', 'python', 'csharp', 'java'].includes(document.languageId),
        languageSpecific: true,
        priority: 4
    },

    // NEW TIPS: Editing Efficiency for newbies 😂😂😂
    {
        id: 'duplicateLine',
        message: 'Pro-Tip: `Shift+Alt+Down/Up` (or `Shift+Option+Down/Up` on macOS) duplicates the current line up or down!',
        actionLabel: 'Try it!',
        frequency: 'once',
        trigger: 'onType',
        condition: (document) => true,
        priority: 5
    },
    {
        id: 'moveLine',
        message: 'Pro-Tip: `Alt+Down/Up` (or `Option+Down/Up` on macOS) moves the current line or selection up or down!',
        actionLabel: 'Got it!',
        frequency: 'once',
        trigger: 'onType',
        condition: (document) => true,
        priority: 5
    },
    {
        id: 'formatDocument',
        message: 'Pro-Tip: `Shift+Alt+F` (or `Shift+Option+F` on macOS) formats your entire document for clean, readable code!',
        actionLabel: 'Don\'t show again',
        frequency: 'once',
        trigger: 'onSave',
        condition: (document) => ['typescript', 'javascript', 'html', 'css', 'json', 'python', 'xml', 'markdown'].includes(document.languageId),
        languageSpecific: true,
        priority: 5
    },
    {
        id: 'toggleSidebar',
        message: 'Pro-Tip: `Ctrl+B` (or `Cmd+B`) quickly toggles the sidebar for more coding space. Great for focus!',
        actionLabel: 'Got it!',
        frequency: 'once',
        trigger: 'onType',
        condition: (document) => true,
        priority: 3
    },
    {
        id: 'renameSymbol',
        message: 'Pro-Tip: Use `F2` to easily rename a variable or function across all its occurrences in your project!',
        actionLabel: 'Try it!',
        frequency: 'once',
        trigger: 'onType',
        condition: (document) => ['typescript', 'javascript', 'python', 'csharp', 'java'].includes(document.languageId),
        languageSpecific: true,
        priority: 5
    },
    {
        id: 'commentCode',
        message: 'Pro-Tip: Select lines and press `Ctrl+/` (or `Cmd+/`) to quickly comment/uncomment code!',
        actionLabel: 'Got it!',
        frequency: 'once',
        trigger: 'onType',
        condition: (document) => true,
        priority: 4
    },
    {
        id: 'quickFix',
        message: 'Pro-Tip: See a lightbulb? Click it or press `Ctrl+.` (or `Cmd+.`) for quick fixes or refactoring suggestions!',
        actionLabel: 'Learn more',
        actionCommand: 'https://code.visualstudio.com/docs/editor/editingevolved#_code-actions-quick-fixes',
        frequency: 'once',
        trigger: 'onType',
        condition: (document) => ['typescript', 'javascript', 'python', 'java', 'csharp'].includes(document.languageId),
        languageSpecific: true,
        priority: 5
    },

    // NEW TIPS: Git Integration (for newbies 😂😂😂)
    {
        id: 'gitDiffView',
        message: 'Pro-Tip: Click the "Source Control" icon on the left sidebar to manage Git. Click a changed file to see its diff!',
        actionLabel: 'Open Source Control',
        actionCommand: 'workbench.view.scm', // Command to open Source Control view
        frequency: 'once',
        trigger: 'onSave',
        condition: (document) => {
             // Only show if the workspace is a Git repository (simple check)
            return vscode.workspace.workspaceFolders !== undefined &&
                   vscode.workspace.workspaceFolders.some(folder =>
                       vscode.Uri.joinPath(folder.uri, '.git').fsPath // Check for .git folder
                   );
        },
        priority: 4
    },
    {
        id: 'gitStaging',
        message: 'Pro-Tip: Use the `+` icon in Source Control to stage changes before committing. Commit early, commit often!',
        actionLabel: 'Got it!',
        frequency: 'once',
        trigger: 'onSave',
        condition: (document) => {
            return vscode.workspace.workspaceFolders !== undefined &&
                   vscode.workspace.workspaceFolders.some(folder =>
                       vscode.Uri.joinPath(folder.uri, '.git').fsPath
                   );
        },
        priority: 3
    },
    {
        id: 'gitCommitShortcut',
        message: 'Pro-Tip: After staging, `Ctrl+Enter` (or `Cmd+Enter`) in the Source Control message box commits your changes!',
        actionLabel: 'Got it!',
        frequency: 'once',
        trigger: 'onSave', // Best effort trigger, could be refined with SCM API if available
        condition: (document) => {
            return vscode.workspace.workspaceFolders !== undefined &&
                   vscode.workspace.workspaceFolders.some(folder =>
                       vscode.Uri.joinPath(folder.uri, '.git').fsPath
                   );
        },
        priority: 3
    },

    // NEW TIPS: Debugging 
    {
        id: 'startDebugging',
        message: 'Pro-Tip: Press `F5` to start debugging. Set breakpoints by clicking next to line numbers!',
        actionLabel: 'Learn Debugging',
        actionCommand: 'https://code.visualstudio.com/docs/editor/debugging',
        frequency: 'once',
        trigger: 'onSave', // Could be 'onType' in a common debug config file
        condition: (document) => ['typescript', 'javascript', 'python', 'java', 'csharp'].includes(document.languageId),
        languageSpecific: true,
        priority: 5
    },
    {
        id: 'debugConsole',
        message: 'Pro-Tip: Use the Debug Console during debugging to evaluate expressions and interact with your code!',
        actionLabel: 'Open Debug Console',
        actionCommand: 'workbench.panel.repl.view', // Command to open debug console
        frequency: 'once',
        trigger: 'onSave',
        condition: (document) => ['typescript', 'javascript', 'python', 'java', 'csharp'].includes(document.languageId),
        languageSpecific: true,
        priority: 4
    },

    // NEW TIPS: General Efficiency
    {
        id: 'installExtensions',
        message: 'Pro-Tip: Explore the Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`) for tools that enhance your workflow and boost productivity!',
        actionLabel: 'Open Extensions',
        actionCommand: 'workbench.view.extensions',
        frequency: 'once',
        trigger: 'onType',
        condition: (document) => true,
        priority: 3
    },
    {
        id: 'userSnippets',
        message: 'Pro-Tip: Create your own custom snippets (`File > Preferences > Configure User Snippets`) for frequently typed code blocks!',
        actionLabel: 'Configure Snippets',
        actionCommand: 'workbench.action.openSnippets',
        frequency: 'once',
        trigger: 'onType',
        condition: (document) => true,
        priority: 4
    },
    {
        id: 'settingsSearch',
        message: 'Pro-Tip: Use the search bar in Settings to quickly find any setting by keyword!',
        actionLabel: 'Open Settings',
        actionCommand: 'workbench.action.openSettings',
        frequency: 'once',
        trigger: 'onType',
        condition: (document) => true,
        priority: 3
    },
    {
        id: 'integratedTerminal',
        message: 'Pro-Tip: Open the integrated terminal (`Ctrl+` `` ` `` / `Cmd+` `` ` ``) for quick command-line access within VS Code!',
        actionLabel: 'Open Terminal',
        actionCommand: 'workbench.action.terminal.toggleTerminal',
        frequency: 'once',
        trigger: 'onType',
        condition: (document) => true,
        priority: 4
    }
];

let dismissedTips: string[] = [];
let ergonomicsTimer: NodeJS.Timeout | undefined;
let lastTipShownTime: number = 0; 

export function activate(context: vscode.ExtensionContext) {
    console.log('Codeflow Coach is active!');

    // Load dismissed tips and last tip time from global state
    dismissedTips = context.globalState.get<string[]>(DISMISSED_TIPS_KEY, []);
    lastTipShownTime = context.globalState.get<number>(LAST_TIP_TIME_KEY, 0);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('codeflowCoach.showTips', () => showManualTips()),
        vscode.commands.registerCommand('codeflowCoach.resetTips', () => resetDismissedTips(context))
    );

    // Register event listeners for "Pro-Tip Pop-ups"
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument((document) => handleDocumentEvent(document, 'onSave', context)),
        vscode.workspace.onDidChangeTextDocument((event) => handleDocumentEvent(event.document, 'onType', context))
    );

    // Start ergonomics reminder
    startErgonomicsReminder(context);

    // Initial welcome/tip on first activation
    if (!context.globalState.get('codeflowCoach.hasActivatedBefore', false)) {
        vscode.window.showInformationMessage(
            'Welcome to Codeflow Coach! I\'ll offer smart tips to boost your productivity. You can customize settings and reset dismissed tips via the Command Palette.',
            'Got it!'
        );
        context.globalState.update('codeflowCoach.hasActivatedBefore', true);
    }
}

export function deactivate() {
    console.log('Codeflow Coach is deactivated');
    if (ergonomicsTimer) {
        clearInterval(ergonomicsTimer);
    }
}

async function showTip(context: vscode.ExtensionContext, tip: Tip) {
    // Runs only show if the tip hasn't been dismissed, or if it's an 'always' tip
    if (dismissedTips.includes(tip.id) && tip.frequency !== 'always') {
        return;
    }

    // Rate-limiting for general tips
    const config = vscode.workspace.getConfiguration('codeflowCoach');
    const minTipDelaySeconds = config.get<number>('minTipDelaySeconds', 60);
    const currentTime = Date.now();

    if (tip.trigger !== 'onInterval' && minTipDelaySeconds > 0) { // Don't apply general delay to ergonomics
        if (currentTime - lastTipShownTime < minTipDelaySeconds * 1000) {
            return; // 
        }
    }
    
    // Check individual tip's rate limit if applicable
    if (tip.frequency === 'rateLimited' && tip.lastShown) {
        if (currentTime - tip.lastShown < (tip.minDelayMinutes || 60) * 60 * 1000) {
            return; // This specific rate-limited tip is on cooldown. So Abeg. Calm down.
        }
    }

    const selection = await vscode.window.showInformationMessage(tip.message, tip.actionLabel || 'Dismiss');

    if (selection === tip.actionLabel) {
        if (tip.actionCommand) {
            if (tip.actionCommand.startsWith('http')) {
                vscode.env.openExternal(vscode.Uri.parse(tip.actionCommand));
            } else {
                vscode.commands.executeCommand(tip.actionCommand);
            }
        }
        // For 'once' or 'onFirstTrigger', add to dismissed list
        if (tip.frequency === 'once' || tip.frequency === 'onFirstTrigger') {
            dismissedTips.push(tip.id);
            await context.globalState.update(DISMISSED_TIPS_KEY, dismissedTips);
        }
    } else if (selection === 'Dismiss' && tip.frequency !== 'always') {
        // If user explicitly dismisses and it's not an 'always' tip
        dismissedTips.push(tip.id);
        await context.globalState.update(DISMISSED_TIPS_KEY, dismissedTips);
    }

    // Update last shown time for non-ergonomics tips
    if (tip.trigger !== 'onInterval') {
        lastTipShownTime = currentTime;
        await context.globalState.update(LAST_TIP_TIME_KEY, lastTipShownTime);
    }
    // Update lastShown for the specific tip for individual rate limiting
    tip.lastShown = currentTime;
}

function handleDocumentEvent(document: vscode.TextDocument, triggerType: 'onSave' | 'onType', context: vscode.ExtensionContext) {
    // Filter out dismissed tips and tips that don't match the trigger type
    let relevantTips = allTips.filter(tip =>
        tip.trigger === triggerType &&
        !dismissedTips.includes(tip.id) &&
        (tip.frequency !== 'rateLimited' || (tip.lastShown ? (Date.now() - tip.lastShown >= (tip.minDelayMinutes || 60) * 60 * 1000) : true))
    );

    // Apply general condition
    relevantTips = relevantTips.filter(tip => (tip.condition ? tip.condition(document) : true));

    if (relevantTips.length > 0) {
        // Prioritize language-specific tips if applicable
        const languageSpecificTips = relevantTips.filter(tip => tip.languageSpecific && tip.condition && tip.condition(document));
        let tipsToChooseFrom = languageSpecificTips.length > 0 ? languageSpecificTips : relevantTips;

        // Sort by priority (descending) and then pick a random one from the highest priority group
        tipsToChooseFrom.sort((a, b) => (b.priority || 0) - (a.priority || 0));

        const highestPriority = tipsToChooseFrom[0].priority;
        const topPriorityTips = tipsToChooseFrom.filter(tip => tip.priority === highestPriority);

        const tipToShow = topPriorityTips[Math.floor(Math.random() * topPriorityTips.length)];

        showTip(context, tipToShow);
    }
}

function startErgonomicsReminder(context: vscode.ExtensionContext) {
    if (ergonomicsTimer) {
        clearInterval(ergonomicsTimer);
    }

    const config = vscode.workspace.getConfiguration('codeflowCoach');
    const intervalMinutes = config.get<number>('ergonomicsReminderIntervalMinutes');

    if (intervalMinutes && intervalMinutes > 0) {
        const ergonomicsTips = allTips.filter(tip => tip.id.startsWith('ergonomicsBreak'));
        if (ergonomicsTips.length === 0) {
            console.warn('No ergonomics tips defined!');
            return;
        }

        ergonomicsTimer = setInterval(() => {
            // Pick a random ergonomics tip
            const tipToShow = ergonomicsTips[Math.floor(Math.random() * ergonomicsTips.length)];
            showTip(context, tipToShow);
        }, intervalMinutes * 60 * 1000); // Convert minutes to milliseconds
        console.log(`Ergonomics reminders set for every ${intervalMinutes} minutes.`);
    } else {
        console.log('Ergonomics reminders disabled.');
    }
}

async function showManualTips() {
    // It Collects all tips, including those that might have been dismissed if user wants to see them
    const allAvailableTips = allTips.filter(tip => tip.trigger !== 'onInterval'); // Exclude interval tips from manual display

    if (allAvailableTips.length > 0) {
        let tipMessages = 'Here are some tips from Codeflow Coach:\n\n';
        allAvailableTips.forEach(tip => {
            const status = dismissedTips.includes(tip.id) ? '(Dismissed)' : '(Available)';
            tipMessages += `- ${tip.message} ${status}\n`;
        });

        vscode.window.showInformationMessage(
            `${tipMessages}\n\n(Dismissed tips can be reset via the Command Palette: "Codeflow Coach: Reset All Dismissed Tips".)`,
            'Got it!'
        );
    } else {
        vscode.window.showInformationMessage('No tips defined or available right now!');
    }
}

async function resetDismissedTips(context: vscode.ExtensionContext) {
    const confirmation = await vscode.window.showInformationMessage(
        'Are you sure you want to reset all dismissed Codeflow Coach tips? All tips will become available again.',
        { modal: true },
        'Yes, Reset', 'No'
    );

    if (confirmation === 'Yes, Reset') {
        dismissedTips = [];
        await context.globalState.update(DISMISSED_TIPS_KEY, dismissedTips);
        vscode.window.showInformationMessage('All Codeflow Coach tips have been reset. Reload VS Code for full effect on active session.');
        // Optionally, prompts for reload to immediately clear any in-memory lastShown states
        // vscode.window.showInformationMessage('Tips reset. Reload VS Code?', 'Reload').then(selection => {
        //     if (selection === 'Reload') vscode.commands.executeCommand('workbench.action.reloadWindow');
        // });
    }
}