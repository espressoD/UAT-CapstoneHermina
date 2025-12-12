// controllers/authController.js
const supabase = require('../config/database');
const { devLog } = require('../middleware/logger');
const { generateAccessToken, generateRefreshToken } = require('../middleware/auth');

/**
 * Login endpoint
 * POST /api/v2/auth/login
 */
const login = async (req, res) => {
  const { id_pegawai, password } = req.body;

  devLog('[LOGIN] Attempt with ID Pegawai:', id_pegawai);

  if (!id_pegawai || !password) {
    return res.status(400).json({ 
      success: false,
      error: 'ID Pegawai dan Password wajib diisi!' 
    });
  }

  try {
    // 1. Get email from id_pegawai using RPC function
    const { data: email, error: rpcError } = await supabase.rpc(
      'get_email_from_id_pegawai',
      { pegawai_id_input: id_pegawai }
    );

    if (rpcError) {
      devLog('[LOGIN] RPC Error:', rpcError);
      throw rpcError;
    }

    if (!email) {
      devLog('[LOGIN] ID Pegawai not found:', id_pegawai);
      return res.status(404).json({ 
        success: false,
        error: 'ID Pegawai tidak ditemukan.' 
      });
    }

    devLog('[LOGIN] Email found:', email);

    // 2. Authenticate with Supabase Auth
    const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (loginError) {
      devLog('[LOGIN] Auth Error:', loginError);
      return res.status(401).json({ 
        success: false,
        error: 'ID Pegawai atau Password salah!' 
      });
    }

    if (!authData.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Login gagal. Tidak ada data user.' 
      });
    }

    devLog('[LOGIN] Auth successful for user:', authData.user.id);

    // 3. Get user profile from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, nama_lengkap, jabatan, role, id_pegawai')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      devLog('[LOGIN] Profile Error:', profileError);
      return res.status(500).json({ 
        success: false,
        error: 'Gagal mengambil data profil user.' 
      });
    }

    devLog('[LOGIN] Profile retrieved:', profile.role);

    // 4. Generate JWT tokens
    const tokenPayload = {
      id: profile.id,
      id_pegawai: profile.id_pegawai,
      nama_lengkap: profile.nama_lengkap,
      jabatan: profile.jabatan,
      role: profile.role
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ id: profile.id });

    devLog('[LOGIN] JWT tokens generated successfully');

    // 5. Return tokens and user data
    res.status(200).json({
      success: true,
      message: 'Login berhasil!',
      accessToken,
      refreshToken,
      user: {
        id: authData.user.id,
        email: authData.user.email
      },
      profile: profile
    });

  } catch (error) {
    console.error('[LOGIN] Server Error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Terjadi kesalahan server.' 
    });
  }
};

/**
 * Logout endpoint
 * POST /api/v2/auth/logout
 */
const logout = async (req, res) => {
  try {
    // With JWT, logout is handled client-side by removing the token
    // Optionally, you can implement token blacklisting here
    
    devLog('[LOGOUT] User logged out:', req.user?.id);
    
    res.status(200).json({ 
      success: true,
      message: 'Logout berhasil!' 
    });

  } catch (error) {
    console.error('[LOGOUT] Server Error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Terjadi kesalahan server.' 
    });
  }
};

/**
 * Get current user profile
 * GET /api/v2/auth/me
 */
const getMe = async (req, res) => {
  try {
    // User info is already in req.user from authenticate middleware
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, nama_lengkap, jabatan, role, id_pegawai, email')
      .eq('id', req.user.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({
        success: false,
        error: 'Profil tidak ditemukan.'
      });
    }

    res.status(200).json({
      success: true,
      profile
    });

  } catch (error) {
    console.error('[GET ME] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan server.'
    });
  }
};

/**
 * Create admin account (superadmin only)
 * POST /api/v2/admin/create-account
 */
const createAdminAccount = async (req, res) => {
  try {
    const { email, nama_lengkap, id_pegawai, jabatan, password, role } = req.body;

    // Validasi input
    if (!email || !nama_lengkap || !id_pegawai || !jabatan || !password || !role) {
      return res.status(400).json({ error: 'Semua field wajib diisi!' });
    }

    // Validasi email format
    if (!email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
      return res.status(400).json({ error: 'Email tidak valid!' });
    }

    // Validasi password minimal 6 karakter
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter!' });
    }

    // Validasi role
    const validRoles = ['admin', 'perawat_kamala', 'perawat_padma'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Role tidak valid!' });
    }

    console.log('Creating admin account for:', email, role);

    // Cek apakah email sudah terdaftar
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email);

    if (existingUser && existingUser.length > 0) {
      console.log('Email already exists');
      return res.status(409).json({ error: 'Email sudah terdaftar!' });
    }

    // Create user di Supabase Auth menggunakan admin API
    console.log('Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nama_lengkap,
        id_pegawai,
        jabatan,
        role
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return res.status(500).json({ error: authError.message || 'Gagal membuat user di Auth!' });
    }

    console.log('Auth user created with ID:', authData.user.id);

    // Insert data ke tabel profiles
    console.log('Inserting to profiles table...');
    const { data: adminUser, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        nama_lengkap,
        id_pegawai,
        jabatan,
        role
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting profiles:', insertError);
      
      // Rollback: hapus user dari auth jika insert gagal
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
        console.log('Rollback: deleted auth user');
      } catch (deleteError) {
        console.error('Error during rollback:', deleteError);
      }
      
      return res.status(500).json({ error: insertError.message || 'Gagal menyimpan data admin!' });
    }

    console.log('Admin user created successfully:', adminUser);

    res.status(201).json({
      message: 'Akun admin berhasil dibuat!',
      user: adminUser
    });

  } catch (error) {
    console.error('Error creating admin account:', error);
    res.status(500).json({ error: error.message || 'Terjadi kesalahan server.' });
  }
};

/**
 * Change password
 * POST /api/v2/auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Password lama dan baru wajib diisi!'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password baru minimal 6 karakter!'
      });
    }

    // Get user email from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        success: false,
        error: 'Profil tidak ditemukan.'
      });
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: currentPassword
    });

    if (signInError) {
      return res.status(401).json({
        success: false,
        error: 'Password lama tidak valid!'
      });
    }

    // Update password using admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Gagal memperbarui password.'
      });
    }

    devLog('[CHANGE PASSWORD] Password updated for user:', userId);

    res.status(200).json({
      success: true,
      message: 'Password berhasil diperbarui!'
    });

  } catch (error) {
    console.error('[CHANGE PASSWORD] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan server.'
    });
  }
};

module.exports = {
  login,
  logout,
  getMe,
  createAdminAccount,
  changePassword
};
