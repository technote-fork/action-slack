"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const webhook_1 = require("@slack/webhook");
exports.Success = 'success';
exports.Failure = 'failure';
exports.Cancelled = 'cancelled';
exports.Custom = 'custom';
exports.Always = 'always';
const groupMention = ['here', 'channel'];
class Client {
    constructor(props, token, webhookUrl) {
        this.with = props;
        if (token !== undefined) {
            this.github = new github.GitHub(token);
        }
        if (webhookUrl === undefined) {
            throw new Error('Specify secrets.SLACK_WEBHOOK_URL');
        }
        this.webhook = new webhook_1.IncomingWebhook(webhookUrl);
    }
    success(text) {
        return __awaiter(this, void 0, void 0, function* () {
            const template = yield this.payloadTemplate();
            template.attachments[0].color = 'good';
            template.text += this.mentionText(this.with.mention, exports.Success);
            template.text += ':white_check_mark: Succeeded GitHub Actions\n';
            template.text += text;
            return template;
        });
    }
    fail(text) {
        return __awaiter(this, void 0, void 0, function* () {
            const template = yield this.payloadTemplate();
            template.attachments[0].color = 'danger';
            template.text += this.mentionText(this.with.mention, exports.Failure);
            template.text += ':no_entry: Failed GitHub Actions\n';
            template.text += text;
            return template;
        });
    }
    cancel(text) {
        return __awaiter(this, void 0, void 0, function* () {
            const template = yield this.payloadTemplate();
            template.attachments[0].color = 'warning';
            template.text += this.mentionText(this.with.mention, exports.Cancelled);
            template.text += ':warning: Canceled GitHub Actions\n';
            template.text += text;
            return template;
        });
    }
    send(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            core.debug(JSON.stringify(github.context, null, 2));
            yield this.webhook.send(payload);
            core.debug('send message');
        });
    }
    payloadTemplate() {
        return __awaiter(this, void 0, void 0, function* () {
            const text = '';
            const { username, icon_emoji, icon_url, channel } = this.with;
            return {
                text,
                username,
                icon_emoji,
                icon_url,
                channel,
                attachments: [
                    {
                        color: '',
                        author_name: this.with.author_name,
                        fields: yield this.fields(),
                    },
                ],
            };
        });
    }
    fields() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { sha } = github.context;
            const { owner, repo } = github.context.repo;
            const commit = yield ((_a = this.github) === null || _a === void 0 ? void 0 : _a.repos.getCommit({
                owner,
                repo,
                ref: sha,
            }));
            const author = commit === null || commit === void 0 ? void 0 : commit.data.commit.author;
            return this.filterField([
                this.repo,
                commit
                    ? {
                        title: 'message',
                        value: commit.data.commit.message,
                        short: true,
                    }
                    : undefined,
                this.commit,
                author
                    ? {
                        title: 'author',
                        value: `${author.name}<${author.email}>`,
                        short: true,
                    }
                    : undefined,
                this.action,
                this.eventName,
                this.ref,
                this.workflow,
            ], undefined);
        });
    }
    get commit() {
        const { sha } = github.context;
        const { owner, repo } = github.context.repo;
        return {
            title: 'commit',
            value: `<https://github.com/${owner}/${repo}/commit/${sha}|${sha}>`,
            short: true,
        };
    }
    get repo() {
        const { owner, repo } = github.context.repo;
        return {
            title: 'repo',
            value: `<https://github.com/${owner}/${repo}|${owner}/${repo}>`,
            short: true,
        };
    }
    get action() {
        var _a, _b;
        const sha = (_b = (_a = github.context.payload.pull_request) === null || _a === void 0 ? void 0 : _a.head.sha) !== null && _b !== void 0 ? _b : github.context.sha;
        const { owner, repo } = github.context.repo;
        return {
            title: 'action',
            value: `<https://github.com/${owner}/${repo}/commit/${sha}/checks|action>`,
            short: true,
        };
    }
    get eventName() {
        return {
            title: 'eventName',
            value: github.context.eventName,
            short: true,
        };
    }
    get ref() {
        return { title: 'ref', value: github.context.ref, short: true };
    }
    get workflow() {
        return { title: 'workflow', value: github.context.workflow, short: true };
    }
    mentionText(mention, status) {
        if (!this.with.if_mention.includes(status) &&
            this.with.if_mention !== exports.Always) {
            return '';
        }
        const normalized = mention.replace(/ /g, '');
        if (groupMention.includes(normalized)) {
            return `<!${normalized}> `;
        }
        else if (normalized !== '') {
            const text = normalized
                .split(',')
                .map(userId => `<@${userId}>`)
                .join(' ');
            return `${text} `;
        }
        return '';
    }
    filterField(array, diff) {
        return array.filter(item => item !== diff);
    }
}
exports.Client = Client;
