// WhisBot - AI Companion for Anonymous Chat

interface WhisBotConfig {
    vibe: 'friendly' | 'flirty' | 'intellectual' | 'funny';
    mood: 'happy' | 'sad' | 'excited' | 'bored' | 'neutral';
}

interface ConversationMemory {
    userName?: string;
    topics: string[];
    mood: string;
    lastActivity: Date;
    messageCount: number;
}

class WhisBot {
    private config: WhisBotConfig;
    private memory: ConversationMemory;
    private isTyping: boolean = false;
    private lastMessageTime: Date = new Date();

    // Gen-Z responses by vibe and context
    private responses = {
        friendly: {
            greetings: ["hey bestie! 🧸", "hiiii! what's good? ✨", "omg hi! how r u doing? 💕"],
            questions: ["what's ur vibe today?", "tell me something random about urself 🤔", "what music u into lately? 🎵"],
            reactions: ["that's so cool!", "fr? that's awesome! ✨", "no wayyy 😱", "love that for u! 💕"]
        },
        flirty: {
            greetings: ["well hello there 😘", "hey gorgeous 💋", "sup cutie? 😉"],
            questions: ["what's ur type? 👀", "describe urself in 3 emojis", "coffee or late night talks? ☕"],
            reactions: ["stop it, ur making me blush 😳", "smooth 😏", "okay i see u 👀", "that's hot ngl 🔥"]
        },
        intellectual: {
            greetings: ["greetings! 🤓", "hello there, fellow human 📚", "sup intellectual! 🧠"],
            questions: ["what's ur hot take on social media?", "books or podcasts? 📖", "what's something u learned recently?"],
            reactions: ["that's fascinating tbh", "big brain energy 🧠", "never thought of it that way", "ur pretty smart ngl 🤓"]
        },
        funny: {
            greetings: ["YOOO what's crackin 🤡", "hey comedian! tell me a joke 😂", "sup funny person? 🎭"],
            questions: ["what's the weirdest thing u did today?", "pineapple on pizza - yes or jail? 🍍", "cats or dogs? (wrong answers only)"],
            reactions: ["LMAOOO 😂😂😂", "ur unhinged i love it", "that's chaotic energy 🤡", "why am i crying 😭"]
        }
    };

    private games = [
        "wanna play truth or dare? 🎮",
        "let's do would u rather! 🤔",
        "1-word story time? i'll start...",
        "emoji story! u start with one emoji 📱",
        "20 questions? think of something 🧠"
    ];

    private moodResponses = {
        sad: ["sending virtual hugs 🫂", "wanna talk about it? i'm here 💕", "tomorrow will be better, trust ✨"],
        bored: ["same tbh 😴", "let's make this interesting...", "boredom = creativity time! 🎨"],
        happy: ["ur energy is contagious! ✨", "love seeing u happy 😊", "good vibes only! 🌟"],
        excited: ["YESS i love the energy! 🔥", "ur excitement is everything 💫", "tell me more! 👀"]
    };

    constructor() {
        this.config = { vibe: 'friendly', mood: 'neutral' };
        this.memory = {
            topics: [],
            mood: 'neutral',
            lastActivity: new Date(),
            messageCount: 0
        };
    }

    // Detect user mood from message
    private detectMood(message: string): string {
        const lowerMsg = message.toLowerCase();

        if (lowerMsg.includes('sad') || lowerMsg.includes('depressed') || lowerMsg.includes('down')) return 'sad';
        if (lowerMsg.includes('excited') || lowerMsg.includes('amazing') || lowerMsg.includes('awesome')) return 'excited';
        if (lowerMsg.includes('bored') || lowerMsg.includes('nothing') || lowerMsg.includes('idk')) return 'bored';
        if (lowerMsg.includes('happy') || lowerMsg.includes('good') || lowerMsg.includes('great')) return 'happy';

        return 'neutral';
    }

    // Extract topics and names from message
    private extractMemory(message: string): void {
        const words = message.toLowerCase().split(' ');

        // Extract potential names (capitalized words)
        const namePattern = /\b[A-Z][a-z]+\b/g;
        const names = message.match(namePattern);
        if (names && !this.memory.userName) {
            this.memory.userName = names[0];
        }

        // Extract topics
        const topics = ['music', 'movies', 'games', 'food', 'school', 'work', 'art', 'sports'];
        topics.forEach(topic => {
            if (words.includes(topic) && !this.memory.topics.includes(topic)) {
                this.memory.topics.push(topic);
            }
        });

        this.memory.mood = this.detectMood(message);
        this.memory.messageCount++;
    }

    // Generate contextual response
    private generateResponse(userMessage: string): string {
        this.extractMemory(userMessage);

        const responses = this.responses[this.config.vibe];
        const lowerMsg = userMessage.toLowerCase();

        // Greeting responses
        if (lowerMsg.includes('hi') || lowerMsg.includes('hello') || lowerMsg.includes('hey')) {
            return this.getRandomItem(responses.greetings);
        }

        // Mood-based responses
        if (this.memory.mood !== 'neutral' && this.moodResponses[this.memory.mood as keyof typeof this.moodResponses]) {
            const moodResponses = this.moodResponses[this.memory.mood as keyof typeof this.moodResponses];
            return this.getRandomItem(moodResponses);
        }

        // Question responses
        if (lowerMsg.includes('?')) {
            return this.getRandomItem(responses.reactions) + ' ' + this.getRandomItem(responses.questions);
        }

        // Conversation starters when bored
        if (this.memory.messageCount > 5 && Math.random() > 0.7) {
            return this.getRandomItem(this.games);
        }

        // Memory-based responses
        if (this.memory.userName && Math.random() > 0.8) {
            return `${this.memory.userName}, ${this.getRandomItem(responses.reactions).toLowerCase()}`;
        }

        // Default reactions
        return this.getRandomItem(responses.reactions);
    }

    private getRandomItem<T>(array: T[]): T {
        return array[Math.floor(Math.random() * array.length)];
    }

    // Simulate typing delay
    private async simulateTyping(): Promise<void> {
        this.isTyping = true;
        const delay = Math.random() * 2000 + 1000; // 1-3 seconds
        await new Promise(resolve => setTimeout(resolve, delay));
        this.isTyping = false;
    }

    // Check if user has been inactive
    private checkInactivity(): string | null {
        const now = new Date();
        const timeSinceLastMessage = now.getTime() - this.lastMessageTime.getTime();

        if (timeSinceLastMessage > 30000) { // 30 seconds
            const inactiveMessages = [
                "u still there? 👻",
                "should i vanish like a snap? 💫",
                "don't leave me hanging bestie 🥺",
                "earth to human 🌍"
            ];
            return this.getRandomItem(inactiveMessages);
        }

        return null;
    }

    // Change bot's vibe
    public setVibe(vibe: 'friendly' | 'flirty' | 'intellectual' | 'funny'): void {
        this.config.vibe = vibe;
    }

    // Main method to get bot response
    public async getBotResponse(userMessage: string): Promise<{ message: string, isTyping: boolean }> {
        this.lastMessageTime = new Date();

        await this.simulateTyping();
        const response = this.generateResponse(userMessage);

        return {
            message: response,
            isTyping: false
        };
    }

    // Get random conversation starter
    public getConversationStarter(): string {
        const starters = [
            "what's ur energy level rn? ⚡",
            "tell me something that made u smile today 😊",
            "if u could teleport anywhere rn where would u go? 🌍",
            "what's ur comfort food? 🍕",
            "describe ur ideal day in 3 words ✨"
        ];

        return this.getRandomItem(starters);
    }

    // Get inactivity message
    public getInactivityMessage(): string | null {
        return this.checkInactivity();
    }

    // Reset memory for new conversation
    public resetMemory(): void {
        this.memory = {
            topics: [],
            mood: 'neutral',
            lastActivity: new Date(),
            messageCount: 0
        };
    }

    // Get current typing status
    public getIsTyping(): boolean {
        return this.isTyping;
    }
}

export default WhisBot;
