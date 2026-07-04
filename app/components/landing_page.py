from pathlib import Path
import streamlit as st
import base64
from components.hero import hero_section


logo_path = (
    Path(__file__).parent.parent
    / "assets"
    / "logos"
    / "roomsync_logo.png"
)

with open(logo_path, "rb") as img:
    logo = base64.b64encode(img.read()).decode()
    
def landing_page():
    
        
    st.markdown(
    f"""
<div class="navbar">

<div class="logo">

<img src="data:image/png;base64,{logo}" class="logo-image">

<span class="logo-text">
RoomSync AI
</span>

</div>

<div class="nav-links">

<a href="#">Home</a>

<a href="#">How It Works</a>

<a href="#">Features</a>

<a href="#">Roadmap</a>

<a href="#">About</a>

</div>

<div class="nav-actions">

<button class="login-btn">
Login / Register
</button>

<button class="primary-nav-btn">
Get Started
</button>

</div>

</div>
""",
unsafe_allow_html=True,
)

    hero_section()