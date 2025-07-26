// Author: Nephi Asha. You can find me on LinkedIn and Github. Just do a quick Search 😏😂😂😂
import * as vscode from 'vscode';

const DISMISSED_TIPS_KEY = 'codeflow-coach.dismissedTips';

interface Tip {
	id: string;
	message: string;
	actionLabel?: string;
	actionCommand?: string;
	frequency?: 'always' | 'once' | 'onFirstTrigger';
	trigger: 'onSave' | 'onType' | 'onCommand' | 'onInterval';
	condition?: (document: vscode.TextDocument) => boolean;
}

const allTips: Tip[] = [
    {
        id: 'fileSaveShortcut',
        message: 'Pro-Tip: Use `Ctrl+S` (or `Cmd+S`) to quickly save your file!',
        actionLabel: 'Don\'t show again',
        frequency: 'once',
        trigger: 'onSave',
        condition: (document) => document.isDirty // Only if it was unsaved
    },
    {
        id: 'commandPalette',
        message: 'Pro-Tip: `Ctrl+Shift+P` (or `Cmd+Shift+P`) opens the Command Palette for quick access to all VS Code features!',
        actionLabel: 'Got it!',
        frequency: 'once',
        trigger: 'onType',
        condition: (document) => document.languageId === 'plaintext' || document.languageId === 'markdown' // Show in less code-specific contexts
    },
    {
        id: 'multiCursor',
        message: 'Pro-Tip: Hold `Alt` and click (or `Option` on macOS) to add multiple cursors for quick parallel edits!',
        actionLabel: 'Tell me more',
        actionCommand: 'https://code.visualstudio.com/docs/editor/codebasics#_multiple-selections-multi-cursor',
        frequency: 'once',
        trigger: 'onSave',
        condition: (document) => true 
    },

    {
        id: 'ergonomicsBreak',
        message: 'Codeflow Coach: Time for a quick break! Stretch, look away, or grab water.',
        actionLabel: 'Take a Micro-Break Now',
        frequency: 'always', 
        trigger: 'onInterval'
    }
];

let dismissedTips: string[] = [];
let ergonomicsTimer: NodeJS.Timeout | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Codeflow Coach is active!');

    // Load dismissed tips from global state
    dismissedTips = context.globalState.get<string[]>(DISMISSED_TIPS_KEY, []);

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
            'Welcome to Codeflow Coach! I\'ll offer tips to boost your productivity. You can reset dismissed tips anytime via the Command Palette.',
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
    if (dismissedTips.includes(tip.id) && tip.frequency !== 'always') {
        return; // Don't show if dismissed and not an 'always' tip
    }

    const selection = await vscode.window.showInformationMessage(tip.message, tip.actionLabel || 'Dismiss');

    if (selection === tip.actionLabel) {
        if (tip.actionCommand) {
            // Check if it's a URL
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
        // runs If user explicitly dismisses and it's not an 'always' tip
        dismissedTips.push(tip.id);
        await context.globalState.update(DISMISSED_TIPS_KEY, dismissedTips);
    }
}

function handleDocumentEvent(document: vscode.TextDocument, triggerType: 'onSave' | 'onType', context: vscode.ExtensionContext) {
    const relevantTips = allTips.filter(tip =>
        tip.trigger === triggerType &&
        !dismissedTips.includes(tip.id) &&
        (tip.condition ? tip.condition(document) : true)
    );

    if (relevantTips.length > 0) {
        // For simplicity, pick one at random or prioritize
        const tipToShow = relevantTips[Math.floor(Math.random() * relevantTips.length)];
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
        ergonomicsTimer = setInterval(() => {
            const ergonomicsTip = allTips.find(tip => tip.id === 'ergonomicsBreak');
            if (ergonomicsTip) {
                showTip(context, ergonomicsTip);
            }
        }, intervalMinutes * 60 * 1000); // Convert minutes to milliseconds. You should know this.. duh😂😂😂
        console.log(`Ergonomics reminders set for every ${intervalMinutes} minutes.`);
    } else {
        console.log('Ergonomics reminders disabled.');
    }
}

async function showManualTips() {
    // This command is used to manually trigger some tips or just to show a summary
    const availableTips = allTips.filter(tip => !dismissedTips.includes(tip.id) || tip.frequency === 'always');

    if (availableTips.length > 0) {
        const tipMessages = availableTips.map(tip => `- ${tip.message}`).join('\n');
        vscode.window.showInformationMessage(
            `Here are some tips from Codeflow Coach:\n\n${tipMessages}\n\n(Some tips appear contextually or are dismissed after showing.)`,
            'Got it!'
        );
    } else {
        vscode.window.showInformationMessage('No new tips available right now!');
    }
}

async function resetDismissedTips(context: vscode.ExtensionContext) {
    const confirmation = await vscode.window.showInformationMessage(
        'Are you sure you want to reset all dismissed Codeflow Coach tips?',
        { modal: true },
        'Yes, Reset', 'No'
    );

    if (confirmation === 'Yes, Reset') {
        dismissedTips = [];
        await context.globalState.update(DISMISSED_TIPS_KEY, dismissedTips);
        vscode.window.showInformationMessage('All Codeflow Coach tips have been reset.');
    }
}