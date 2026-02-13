const testLogin = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'test123'
      })
    });
    
    const data = await response.json();
    
    console.log('Login response:');
    console.log('Status:', response.status);
    console.log('User data:', data.user);
    console.log('Token:', data.token ? 'Present' : 'Missing');
    console.log('Static ID in response:', data.user?.staticId);
    console.log('Status in response:', data.user?.status);
    
    if (response.status !== 200) {
      console.log('Error message:', data.error);
    }
    
  } catch (error) {
    console.error('Login failed:', error.message);
  }
};

testLogin();