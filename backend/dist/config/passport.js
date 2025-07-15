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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupPassport = void 0;
const passport_1 = __importDefault(require("passport"));
const passport_linkedin_oauth2_1 = require("passport-linkedin-oauth2");
const user_model_1 = require("../models/user.model");
const config_1 = __importDefault(require("./config"));
const setupPassport = () => {
    // LinkedIn strategy
    passport_1.default.use(new passport_linkedin_oauth2_1.Strategy({
        clientID: config_1.default.linkedin.clientId || '',
        clientSecret: config_1.default.linkedin.clientSecret || '',
        callbackURL: config_1.default.linkedin.callbackUrl || '',
        scope: ['openid profile email  w_member_social']
    }, (accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        try {
            const { id, name, emails, photos } = profile;
            const [email] = profile.emails || [];
            // Check if user exists
            let user = yield user_model_1.User.findOne({
                email: profile.emails[0].value
            });
            if (!user) {
                // Create new user if doesn't exist
                user = yield user_model_1.User.create({
                    email: profile.emails[0].value,
                    firstName: profile.name.givenName,
                    lastName: profile.name.familyName,
                    password: Math.random().toString(36).substring(2, 15), // Random password
                    role: user_model_1.UserRole.ATTENDEE,
                    profileImage: (_b = (_a = profile.photos) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value,
                    socialLinks: {
                        linkedin: profile.id,
                        linkedinAccessToken: accessToken
                    }
                });
            }
            else if (!((_c = user.socialLinks) === null || _c === void 0 ? void 0 : _c.linkedinId)) {
                // Update existing user with LinkedIn ID if not set
                user.socialLinks = Object.assign(Object.assign({}, user.socialLinks), { linkedinId: profile.id, linkedinAccessToken: accessToken });
                user.firstName = profile.name.givenName;
                user.lastName = profile.name.familyName;
                user.email = profile.emails[0].value;
                user.role = user_model_1.UserRole.ATTENDEE;
                // Update profile picture if not set
                user.profileImage = ((_e = (_d = profile.photos) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.value) || user.profileImage;
                yield user.save();
            }
            return done(null, user);
        }
        catch (error) {
            return done(error);
        }
    })));
    // Serialize user
    passport_1.default.serializeUser((user, done) => {
        done(null, user.id);
    });
    // Deserialize user
    passport_1.default.deserializeUser((id, done) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const user = yield user_model_1.User.findById(id);
            done(null, user);
        }
        catch (error) {
            done(error);
        }
    }));
};
exports.setupPassport = setupPassport;
