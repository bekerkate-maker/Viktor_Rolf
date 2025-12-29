import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

const JOB_TITLES = [
  'Product Developer',
  'Designer',
  'Merchandiser',
  'Quality Control',
  'Production Manager',
  'Pattern Maker',
  'Sample Coordinator',
  'Technical Designer',
  'Textile Designer',
  'Other'
];

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    job_title: '',
    custom_job_title: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCustomTitle, setShowCustomTitle] = useState(false);

  const handleJobTitleChange = (value: string) => {
    setFormData({ ...formData, job_title: value });
    setShowCustomTitle(value === 'Other');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!formData.job_title) {
      setError('Please select your job title');
      return;
    }

    if (formData.job_title === 'Other' && !formData.custom_job_title) {
      setError('Please enter your custom job title');
      return;
    }

    setLoading(true);

    try {
      const finalJobTitle = formData.job_title === 'Other' 
        ? formData.custom_job_title 
        : formData.job_title;

      const response = await axios.post('http://localhost:3001/api/auth/register', {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
        job_title: finalJobTitle
      });
      
      // Store token and user info
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect to home
      navigate('/home');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <h1 className="auth-brand">VIKTOR & ROLF</h1>
          <p className="auth-subtitle">Sample Control System</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2 className="auth-title">Create Account</h2>
          
          {error && <div className="auth-error">{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
                placeholder="First name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
                placeholder="Last name"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="your.email@viktor-rolf.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Job Title</label>
            <select
              className="form-select"
              value={formData.job_title}
              onChange={(e) => handleJobTitleChange(e.target.value)}
              required
            >
              <option value="">Select your role</option>
              {JOB_TITLES.map(title => (
                <option key={title} value={title}>{title}</option>
              ))}
            </select>
          </div>

          {showCustomTitle && (
            <div className="form-group">
              <label className="form-label">Custom Job Title</label>
              <input
                type="text"
                className="form-input"
                value={formData.custom_job_title}
                onChange={(e) => setFormData({ ...formData, custom_job_title: e.target.value })}
                required={showCustomTitle}
                placeholder="Enter your job title"
              />
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                placeholder="Min. 6 characters"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-input"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                placeholder="Confirm password"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login" className="auth-link">Sign in here</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;
