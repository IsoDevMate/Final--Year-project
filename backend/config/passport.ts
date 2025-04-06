import passport from 'passport';
import { Strategy as LinkedInStrategy, Profile as LinkedInProfile, } from 'passport-linkedin-oauth2';
import { User, UserRole } from '../models/user.model';
import config from './config';

export const setupPassport = () => {
  // LinkedIn strategy
  passport.use(new LinkedInStrategy({
    clientID: config.linkedin.clientId || '',
    clientSecret: config.linkedin.clientSecret || '',
    callbackURL: config.linkedin.callbackUrl || '',
    scope: ['openid profile email  w_member_social']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
        const { id, name, emails, photos } = profile;
      const [email] = profile.emails || [];
      // Check if user exists
      let user = await User.findOne({
        email: profile.emails[0].value
      });

            if (!user) {
        // Create new user if doesn't exist
        user = await User.create({
          email: profile.emails[0].value,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          password: Math.random().toString(36).substring(2, 15), // Random password
          role: UserRole.ATTENDEE,
          profileImage: profile.photos?.[0]?.value,
          socialLinks: {
            linkedin: profile.id,
            linkedinAccessToken: accessToken
          }
        });
      } else if (!user.socialLinks?.linkedinId) {
        // Update existing user with LinkedIn ID if not set
        user.socialLinks = {
            ...user.socialLinks,
          linkedinId: profile.id,
          linkedinAccessToken: accessToken,
          };
          user.firstName = profile.name.givenName;
          user.lastName = profile.name.familyName;
          user.email = profile.emails[0].value;
          user.role = UserRole.ATTENDEE;
          // Update profile picture if not set
         user.profileImage = profile.photos?.[0]?.value || user.profileImage;
        await user.save();
      }

      return done(null, user);
    } catch (error) {
      return done(error as Error);
    }
  }));

  // Serialize user
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user as any);
    } catch (error) {
      done(error);
    }
  });
};
