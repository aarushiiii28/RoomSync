import streamlit as st
from textwrap import dedent


def hero_section():

    st.markdown(
        dedent("""
<div class="hero">

<!-- LEFT SIDE -->

<div class="hero-left">

<div class="hero-title" role="heading" aria-level="1">
Find your perfect<br>
roommate with<br>
<span>AI that understands you.</span>
</div>

<div class="hero-description">
RoomSync AI analyzes your lifestyle, habits and compatibility
preferences to recommend roommates you'll actually enjoy living with.
</div>

<div class="hero-buttons">
<button class="primary-btn">
Start Matching Now →
</button>

<button class="secondary-btn">
▶ Watch Demo
</button>
</div>

<div class="hero-benefits">

<div class="benefit">
<span class="dot"></span>
<div>
<h4>Personalized Matching</h4>
<p>Matches based on your lifestyle and preferences</p>
</div>
</div>

<div class="benefit">
<span class="dot"></span>
<div>
<h4>Privacy First</h4>
<p>Your data stays private and secure</p>
</div>
</div>

<div class="benefit">
<span class="dot"></span>
<div>
<h4>Instant Results</h4>
<p>Get your compatibility score in seconds</p>
</div>
</div>

<div class="benefit">
<span class="dot"></span>
<div>
<h4>96% Compatibility Accuracy</h4>
<p>Highly accurate matches you can trust</p>
</div>
</div>

</div>

</div>

<!-- RIGHT SIDE -->

<div class="hero-right">

<div class="compatibility-card">

<div class="live-status">
● LIVE AI ENGINE
</div>

<div class="card-heading">
🧠 AI Matching Engine
</div>

<div class="score-label">
Compatibility Score
</div>

<div class="compatibility-score">
❤️ 96.8%
</div>

<div class="progress-bar">
<div class="progress-fill"></div>
</div>

<div class="prediction-text">
Predicted using behavioural similarity,
explainable AI and machine learning.
</div>

<div class="match-list">
<div>✓ Sleep Compatibility</div>
<div>✓ Cleanliness Match</div>
<div>✓ Privacy Balance</div>
<div>✓ Study Schedule Match</div>
</div>

<div class="card-divider"></div>

<div class="mini-stats">

<div>
<span>Wake Time</span>
<strong>7:00 AM</strong>
</div>

<div>
<span>Noise Level</span>
<strong>Low</strong>
</div>

<div>
<span>Lifestyle Match</span>
<strong>94%</strong>
</div>

</div>

</div>

</div>

</div>
"""),
        unsafe_allow_html=True,
    )