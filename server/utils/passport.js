import passport from 'passport'
import GoogleStrategy from 'passport-google-oauth20'
import NaverStrategy from 'passport-naver-v2'

export function setupPassport() {
  // Google Strategy
  passport.use(new GoogleStrategy({
    clientID: useRuntimeConfig().googleClientId,
    clientSecret: useRuntimeConfig().googleClientSecret,
    callbackURL: '/api/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // 여기서 사용자 정보 처리 및 DB 저장/조회
      const user = {
        userid: profile.id,
        name: profile.displayName,
        email: profile.emails?.[0]?.value,
        provider: 'google'
      }
      return done(null, user)
    } catch (error) {
      return done(error, null)
    }
  }))

  // Naver Strategy
  passport.use(new NaverStrategy({
    clientID: useRuntimeConfig().naverClientId,
    clientSecret: useRuntimeConfig().naverClientSecret,
    callbackURL: '/api/auth/naver/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // 여기서 사용자 정보 처리 및 DB 저장/조회
      const user = {
        userid: profile.id,
        name: profile.displayName,
        email: profile.email,
        provider: 'naver'
      }
      return done(null, user)
    } catch (error) {
      return done(error, null)
    }
  }))
}
