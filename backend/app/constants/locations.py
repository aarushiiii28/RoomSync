"""
Hierarchical location database and validation constants for RoomSync.

Hierarchy:
  Country -> States/UTs -> Cities -> PIN Code prefix mapping
"""

from typing import Dict, List, Set, Tuple

# Supported Countries
SUPPORTED_COUNTRIES: List[str] = ["India"]

# Map of Country -> State -> List of Cities
INDIA_LOCATION_DATA: Dict[str, List[str]] = {
    # 28 Indian States
    "Andhra Pradesh": [
        "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool",
        "Rajahmundry", "Tirupati", "Kakinada", "Kadapa", "Anantapur",
        "Eluru", "Vizianagaram", "Ongole", "Nandyal", "Machilipatnam",
        "Tenali", "Proddatur", "Chittoor", "Hindupur", "Bhimavaram"
    ],
    "Arunachal Pradesh": [
        "Itanagar", "Naharlagun", "Pasighat", "Tawang", "Ziro", "Roing",
        "Tezu", "Bomdila", "Aalo"
    ],
    "Assam": [
        "Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon",
        "Tinsukia", "Tezpur", "Bongaigaon", "Diphu", "Dhubri",
        "North Lakhimpur", "Karimganj", "Sivasagar", "Goalpara"
    ],
    "Bihar": [
        "Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia",
        "Darbhanga", "Bihar Sharif", "Arrah", "Begusarai", "Katihar",
        "Munger", "Chhapra", "Saharsa", "Sasaram", "Hajipur",
        "Dehri", "Bettiah", "Motihari", "Siwan", "Kishanganj",
        "Buxar", "Jehanabad", "Aurangabad (Bihar)", "Nawada"
    ],
    "Chhattisgarh": [
        "Raipur", "Bhilai", "Bilaspur", "Korba", "Durg",
        "Rajnandgaon", "Raigarh", "Jagdalpur", "Ambikapur", "Dhamtari",
        "Mahasamund"
    ],
    "Goa": [
        "Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda",
        "Bicholim", "Curchorem", "Cuncolim", "Valpoi"
    ],
    "Gujarat": [
        "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar",
        "Jamnagar", "Junagadh", "Gandhinagar", "Anand", "Navsari",
        "Morbi", "Nadiad", "Surendranagar", "Bharuch", "Mehsana",
        "Bhuj", "Porbandar", "Vapi", "Valsad", "Godhra", "Palanpur",
        "Veraval", "Patan", "Dahod", "Botad", "Amreli"
    ],
    "Haryana": [
        "Gurugram", "Faridabad", "Panipat", "Ambala", "Yamunanagar",
        "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula",
        "Sirsa", "Bahadurgarh", "Jind", "Thanesar", "Kaithal",
        "Rewari", "Palwal", "Hansi", "Narnaul", "Fatehabad"
    ],
    "Himachal Pradesh": [
        "Shimla", "Dharamshala", "Solan", "Mandi", "Kullu",
        "Manali", "Baddi", "Palampur", "Bilaspur (HP)", "Nahan",
        "Una", "Hamirpur", "Chamba", "Paonta Sahib"
    ],
    "Jharkhand": [
        "Ranchi", "Jamshedpur", "Dhanbad", "Bokaro Steel City", "Deoghar",
        "Hazaribagh", "Giridih", "Ramgarh", "Medininagar", "Phusro",
        "Chaibasa", "Dumka", "Gumia", "Ghatshila"
    ],
    "Karnataka": [
        "Bengaluru", "Mysuru", "Hubballi-Dharwad", "Mangaluru", "Belagavi",
        "Davanagere", "Ballari", "Vijayapura", "Shivamogga", "Tumakuru",
        "Kalaburagi", "Udupi", "Hassan", "Bidar", "Hosapete",
        "Gadag-Betageri", "Chikkamagaluru", "Raichur", "Bagalkote", "Robertsonpet"
    ],
    "Kerala": [
        "Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam",
        "Palakkad", "Alappuzha", "Kannur", "Kottayam", "Malappuram",
        "Kasaragod", "Pathanamthitta", "Idukki", "Wayanad (Kalpetta)"
    ],
    "Madhya Pradesh": [
        "Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain",
        "Sagar", "Dewas", "Satna", "Ratlam", "Rewa",
        "Katni", "Singrauli", "Burhanpur", "Khandwa", "Morena",
        "Bhind", "Chhindwara", "Guna", "Shivpuri", "Vidisha",
        "Damoh", "Mandsaur", "Khargone", "Neemuch", "Pithampur"
    ],
    "Maharashtra": [
        "Mumbai", "Pune", "Nagpur", "Thane", "Nashik",
        "Kalyan-Dombivli", "Vasai-Virar", "Navi Mumbai", "Chhatrapati Sambhajinagar",
        "Solapur", "Mira-Bhayandar", "Bhiwandi", "Amravati", "Nanded",
        "Kolhapur", "Akola", "Ulhasnagar", "Sangli", "Malegaon",
        "Jalgaon", "Latur", "Dhule", "Ahmednagar", "Chandrapur",
        "Parbhani", "Jalna", "Panvel", "Satara", "Ratnagiri"
    ],
    "Manipur": [
        "Imphal", "Churachandpur", "Thoubal", "Kakching", "Ukhrul",
        "Senapati", "Bishnupur"
    ],
    "Meghalaya": [
        "Shillong", "Tura", "Jowai", "Nongpoh", "Cherrapunji",
        "Williamnagar", "Baghmara"
    ],
    "Mizoram": [
        "Aizawl", "Lunglei", "Saiha", "Champhai", "Kolasib",
        "Serchhip", "Lawngtlai"
    ],
    "Nagaland": [
        "Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha",
        "Zunheboto", "Mon", "Phek"
    ],
    "Odisha": [
        "Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur",
        "Puri", "Balasore", "Bhadrak", "Baripada", "Jharsuguda",
        "Jeypore", "Bargarh", "Rayagada", "Angul"
    ],
    "Punjab": [
        "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda",
        "Mohali (SAS Nagar)", "Hoshiarpur", "Batala", "Pathankot", "Moga",
        "Abohar", "Malerkotla", "Khanna", "Phagwara", "Muktsar",
        "Barnala", "Firozpur", "Kapurthala"
    ],
    "Rajasthan": [
        "Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer",
        "Udaipur", "Bhilwara", "Alwar", "Bharatpur", "Sri Ganganagar",
        "Sikar", "Pali", "Chittorgarh", "Beawar", "Jhunjhunu",
        "Kishangarh", "Barmer", "Hanumangarh", "Tonk"
    ],
    "Sikkim": [
        "Gangtok", "Namchi", "Geyzing", "Mangan", "Ravangla",
        "Jorethang", "Singtam"
    ],
    "Tamil Nadu": [
        "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem",
        "Tiruppur", "Erode", "Tirunelveli", "Vellore", "Thoothukudi",
        "Dindigul", "Thanjavur", "Ranipet", "Sivakasi", "Karur",
        "Udhagamandalam (Ooty)", "Hosur", "Nagercoil", "Kanchipuram", "Kumarakonam",
        "Cuddalore", "Kanyakumari"
    ],
    "Telangana": [
        "Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Ramagundam",
        "Khammam", "Mahbubnagar", "Nalgonda", "Adilabad", "Suryapet",
        "Siddipet", "Miryalaguda", "Mancherial", "Jagtial"
    ],
    "Tripura": [
        "Agartala", "Dharmanagar", "Udaipur (Tripura)", "Kailashahar", "Belonia",
        "Ambassa", "Khowai"
    ],
    "Uttar Pradesh": [
        "Lucknow", "Kanpur", "Ghaziabad", "Agra", "Meerut",
        "Varanasi", "Prayagraj", "Bareilly", "Aligarh", "Moradabad",
        "Saharanpur", "Gorakhpur", "Noida", "Greater Noida", "Firozabad",
        "Jhansi", "Muzaffarnagar", "Mathura", "Ayodhya", "Budaun",
        "Rampur", "Shahjahanpur", "Farrukhabad", "Hapur", "Etawah",
        "Mirzapur", "Bulandshahr", "Sambhal", "Amroha", "Hardoi"
    ],
    "Uttarakhand": [
        "Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur",
        "Kashipur", "Rishikesh", "Nainital", "Mussoorie", "Almora",
        "Pithoragarh", "Kotdwar", "Tehri"
    ],
    "West Bengal": [
        "Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri",
        "Bardhaman", "Malda", "Baharampur", "Habra", "Kharagpur",
        "Shantipur", "Dankuni", "Dhulian", "Ranaghat", "Haldia",
        "Darjeeling", "Midnapore", "Alipurduar", "Purulia", "Jalpaiguri"
    ],

    # 8 Union Territories
    "Delhi (NCT)": [
        "New Delhi", "Central Delhi", "North Delhi", "South Delhi",
        "East Delhi", "West Delhi", "North West Delhi", "North East Delhi",
        "South West Delhi", "South East Delhi", "Dwarka", "Rohini",
        "Saket", "Connaught Place", "Karol Bagh", "Vasant Kunj",
        "Laxmi Nagar", "Janakpuri", "Pitampura", "Hauz Khas", "Mayur Vihar"
    ],
    "Chandigarh": ["Chandigarh"],
    "Andaman and Nicobar Islands": [
        "Port Blair", "Diglipur", "Garacharma", "Bambooflat"
    ],
    "Dadra and Nagar Haveli and Daman and Diu": [
        "Daman", "Diu", "Silvassa"
    ],
    "Jammu and Kashmir": [
        "Srinagar", "Jammu", "Anantnag", "Baramulla", "Udhampur",
        "Kathua", "Sopore", "Rajouri", "Punch", "Kupwara"
    ],
    "Ladakh": ["Leh", "Kargil"],
    "Lakshadweep": ["Kavaratti", "Agatti", "Andrott", "Minicoy", "Amini"],
    "Puducherry": ["Puducherry", "Karaikal", "Mahe", "Yanam"]
}

# Country -> States Map
COUNTRY_STATES_MAP: Dict[str, List[str]] = {
    "India": list(INDIA_LOCATION_DATA.keys())
}

# State-level PIN Code First Digit validation map for India
# India PIN code first digits:
# 1: Delhi, Haryana, Punjab, Himachal Pradesh, Jammu & Kashmir, Ladakh, Chandigarh
# 2: Uttar Pradesh, Uttarakhand
# 3: Rajasthan, Gujarat, Daman & Diu, Dadra & Nagar Haveli
# 4: Maharashtra, Goa, Madhya Pradesh, Chhattisgarh
# 5: Andhra Pradesh, Telangana, Karnataka
# 6: Tamil Nadu, Kerala, Puducherry, Lakshadweep
# 7: West Bengal, Odisha, Arunachal Pradesh, Assam, Manipur, Meghalaya, Mizoram, Nagaland, Tripura, Sikkim, Andaman & Nicobar
# 8: Bihar, Jharkhand
STATE_PIN_PREFIX_MAP: Dict[str, Tuple[str, ...]] = {
    "Delhi (NCT)": ("1",),
    "Haryana": ("1",),
    "Punjab": ("1",),
    "Himachal Pradesh": ("1",),
    "Jammu and Kashmir": ("1",),
    "Ladakh": ("1",),
    "Chandigarh": ("1",),
    "Uttar Pradesh": ("2",),
    "Uttarakhand": ("2",),
    "Rajasthan": ("3",),
    "Gujarat": ("3",),
    "Dadra and Nagar Haveli and Daman and Diu": ("3",),
    "Maharashtra": ("4",),
    "Goa": ("4",),
    "Madhya Pradesh": ("4",),
    "Chhattisgarh": ("4",),
    "Andhra Pradesh": ("5",),
    "Telangana": ("5",),
    "Karnataka": ("5",),
    "Tamil Nadu": ("6",),
    "Kerala": ("6",),
    "Puducherry": ("6",),
    "Lakshadweep": ("6",),
    "West Bengal": ("7",),
    "Odisha": ("7",),
    "Arunachal Pradesh": ("7",),
    "Assam": ("7",),
    "Manipur": ("7",),
    "Meghalaya": ("7",),
    "Mizoram": ("7",),
    "Nagaland": ("7",),
    "Tripura": ("7",),
    "Sikkim": ("7",),
    "Andaman and Nicobar Islands": ("7",),
    "Bihar": ("8",),
    "Jharkhand": ("8",),
}


def normalize_string(val: str) -> str:
    """Normalize string by trimming and collapsing whitespace."""
    if not val:
        return ""
    return " ".join(val.strip().split())


def get_states_for_country(country: str) -> List[str]:
    """Return all valid states for the given country."""
    norm_country = normalize_string(country)
    for c_name, states in COUNTRY_STATES_MAP.items():
        if c_name.lower() == norm_country.lower():
            return states
    return []


def get_cities_for_state(country: str, state: str) -> List[str]:
    """Return all valid cities for the given country and state."""
    norm_country = normalize_string(country)
    norm_state = normalize_string(state)

    if norm_country.lower() == "india":
        for s_name, cities in INDIA_LOCATION_DATA.items():
            # Match state name or state without (UT) note
            clean_s_name = s_name.split("(")[0].strip().lower()
            clean_norm_state = norm_state.split("(")[0].strip().lower()
            if s_name.lower() == norm_state.lower() or clean_s_name == clean_norm_state:
                return cities
    return []


def is_valid_country(country: str) -> bool:
    """Check if the country is a recognized supported country."""
    norm = normalize_string(country).lower()
    return any(c.lower() == norm for c in SUPPORTED_COUNTRIES)


def is_valid_state(country: str, state: str) -> bool:
    """Check if the state belongs to the given country."""
    valid_states = get_states_for_country(country)
    norm_state = normalize_string(state).lower()
    clean_norm_state = norm_state.split("(")[0].strip()
    return any(
        s.lower() == norm_state or s.split("(")[0].strip().lower() == clean_norm_state
        for s in valid_states
    )


def is_valid_city(country: str, state: str, city: str) -> bool:
    """Check if the city belongs to the given country and state."""
    valid_cities = get_cities_for_state(country, state)
    norm_city = normalize_string(city).lower()
    clean_norm_city = norm_city.split("(")[0].strip()
    return any(
        c.lower() == norm_city or c.split("(")[0].strip().lower() == clean_norm_city
        for c in valid_cities
    )


def find_state_for_city(country: str, city: str) -> List[str]:
    """Find which state(s) contain the given city within the country."""
    norm_country = normalize_string(country)
    norm_city = normalize_string(city).lower()
    clean_norm_city = norm_city.split("(")[0].strip()

    matching_states = []
    if norm_country.lower() == "india":
        for s_name, cities in INDIA_LOCATION_DATA.items():
            if any(
                c.lower() == norm_city or c.split("(")[0].strip().lower() == clean_norm_city
                for c in cities
            ):
                matching_states.append(s_name)
    return matching_states


def is_valid_pincode_for_state(state: str, pincode: str) -> Tuple[bool, str]:
    """
    Validate PIN code for India:
    - Must be exactly 6 digits
    - First digit must match the expected zone prefix for the state
    """
    cleaned_pin = pincode.strip()
    if not cleaned_pin.isdigit() or len(cleaned_pin) != 6:
        return False, "PIN code must contain exactly 6 digits."

    norm_state = normalize_string(state)
    for s_name, prefixes in STATE_PIN_PREFIX_MAP.items():
        clean_s = s_name.split("(")[0].strip().lower()
        clean_norm_s = norm_state.split("(")[0].strip().lower()
        if s_name.lower() == norm_state.lower() or clean_s == clean_norm_s:
            if not any(cleaned_pin.startswith(p) for p in prefixes):
                expected_prefix = "/".join(prefixes)
                return False, f"PIN code for {s_name} must begin with {expected_prefix} (e.g. {expected_prefix}xxxxx)."
            return True, ""

    return True, ""
