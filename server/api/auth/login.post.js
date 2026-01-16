import bcrypt from 'bcrypt';
import { getDbPool } from '../../utils/db';
import { generateToken } from '../../utils/jwt';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    
    if (!body.userid || !body.password) {
      return {
        success: false,
        error: '아이디와 비밀번호를 입력해주세요.'
      };
    }
    
    const pool = getDbPool();
    
    // 사용자 조회
    const [users] = await pool.query(
      'SELECT userid, name, email, password FROM laon_tbl_user WHERE userid = ?',
      [body.userid]
    );
    
    if (users.length === 0) {
      return {
        success: false,
        error: '아이디 또는 비밀번호가 일치하지 않습니다.'
      };
    }
    
    const user = users[0];
    
    console.log('Login - Raw user from DB:', JSON.stringify(user, null, 2)); // 전체 사용자 정보 확인
    
    // 비밀번호 확인
    const isValid = await bcrypt.compare(body.password, user.password);
    
    if (!isValid) {
      return {
        success: false,
        error: '아이디 또는 비밀번호가 일치하지 않습니다.'
      };
    }
    
    console.log('Login - User email from DB:', user.email); // 이메일 specifically 확인
    console.log('Login - User name from DB:', user.name); // 이름 확인
    
    // JWT 토큰 생성
    const token = generateToken({
      userid: user.userid,
      name: user.name,
      email: user.email
    });
    
    // 쿠키에 토큰 저장
    setCookie(event, 'auth_token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 24시간
      path: '/'
    });
    
    console.log('Login - User from DB:', user); // 디버깅용
    
    // Session에 사용자 정보 저장 (Nuxt3 방식)
    await useSession(event, {
      password: useRuntimeConfig().sessionSecret
    }).then(session => {
      session.data.user = {
        userid: user.userid,
        name: user.name,
        email: user.email,
        provider: 'local',
        loginTime: new Date()
      };
      console.log('Login - Session saved:', session.data.user); // 디버깅용
    });
    
    // 사용자 정보 쿠키 저장
    setCookie(event, 'user_name', user.name, {
      maxAge: 60 * 60 * 24,
      path: '/'
    });
    
    setCookie(event, 'user_id', user.userid, {
      maxAge: 60 * 60 * 24,
      path: '/'
    });
    
    return {
      success: true,
      user: {
        userid: user.userid,
        name: user.name
      }
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});