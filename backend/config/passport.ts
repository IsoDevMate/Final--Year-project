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
            linkedin: profile.id
          }
        });
      } else if (!user.socialLinks?.linkedinId) {
        // Update existing user with LinkedIn ID if not set
        user.socialLinks = {
            ...user.socialLinks,
            linkedinId: profile.id
          };
        user.firstName = profile.name.givenName;
          user.lastName = profile.name.familyName;
          user.email = profile.emails[0].value;
          user.role = UserRole.ATTENDEE;
          // Update profile picture if not set
         user.profileImage = profile.photos?.[0]?.value || user.profileImage;
        await user.save();
      }

      // if (!user) {
      //   // Create new user
      //   user = new User({
      //     email: emails?.[0]?.value || '',
      //     firstName: name.givenName,
      //     lastName: name.familyName,
      //     profileImage: photos[0].value,
      //     role: UserRole.USER,
      //   });
      //   await user.save();
      // } else {
      //   // Update existing user
      //   user.profilePicture = photos[0].value;
      //   await user.save();
      // }

      // Return user
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
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
};
