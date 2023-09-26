// Handle action selection and video playback
const robotVideo = document.getElementById('robot-video');
const actionButtonsContainer = document.getElementById('action-buttons');
const actionTextContainer = document.getElementById('action-text');

const actions = {
    start: {
        text: 'The robot is ready to perform an action. Choose one:',
        choices: [
            { text: 'Dance', action: 'dance' },
            { text: 'Deliver Food', action: 'deliver' },
            { text: 'Vacuum', action: 'robovac' },
        ],
    },
    dance: {
        text: 'The robot danced. What should the robot do next?',
        choices: [
            { text: 'Play chess', action: 'chess' },
            { text: 'Sort chocolate', action: 'chocolate' },
        ],
    },
    deliver: {
        text: 'The robot delivered food. What should the robot do next?',
        choices: [
            { text: 'Drop an egg', action: 'egg' },
        ],
    },
    robovac: {
        text: 'The robot vacuumed the floor. What should the robot do next?',
        choices: [
            { text: 'Perform a Michelangelo', action: 'michelangelo' },
        ],
    },
    chess: {
        text: 'The robot played chess. What should the robot do next?',
        choices: [
            { text: 'Back to Start', action: 'start' },
        ],
    },
    chocolate: {
        text: 'The robot sorted some chocolate. What should the robot do next?',
        choices: [
            { text: 'Back to Start', action: 'start' },
        ],
    },
    egg: {
        text: 'The robot dropped an egg. What should the robot do next?',
        choices: [
            { text: 'Back to Start', action: 'start' },
        ],
    },
    michelangelo: {
        text: 'The robot performed a Michelangelo. What should the robot do next?',
        choices: [
            { text: 'Back to Start', action: 'start' },
        ],
    },
};

function displayActions(actionName) {
    const action = actions[actionName];
    const actionButtons = action.choices.map((choice) => {
        const button = document.createElement('button');
        button.textContent = choice.text;
        button.style.fontSize = '30px';
        button.addEventListener('click', () => performAction(choice.action));
        return button;
    });

    // Clear existing buttons and add the new ones
    actionButtonsContainer.innerHTML = '';
    actionButtons.forEach((button) => {
        actionButtonsContainer.appendChild(button);
    });

    // Update the action text
    actionTextContainer.textContent = action.text;

    // Update the video source
    robotVideo.src = actionName === 'start' ? '/assets/videos/start.mp4' : `/assets/videos/${actionName}.mp4`;
}

function performAction(actionName) {
    displayActions(actionName);
}

// Start the initial action
displayActions('start');
