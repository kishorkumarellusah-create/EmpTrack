import streamlit as st

# Initialize session state
if 'runs' not in st.session_state:
    st.session_state.runs = 0
    st.session_state.wickets = 0
    st.session_state.completed_overs = 0
    st.session_state.current_over_balls = 0
    st.session_state.recent_balls = []
    st.session_state.history = []

def save_history():
    st.session_state.history.append({
        'runs': st.session_state.runs,
        'wickets': st.session_state.wickets,
        'completed_overs': st.session_state.completed_overs,
        'current_over_balls': st.session_state.current_over_balls,
        'recent_balls': list(st.session_state.recent_balls)
    })

def handle_ball(event_type, value, label):
    save_history()
    
    st.session_state.runs += value
    
    if event_type == 'wicket':
        st.session_state.wickets += 1
        st.session_state.current_over_balls += 1
    elif event_type == 'run':
        st.session_state.current_over_balls += 1
    elif event_type in ['wide', 'noball']:
        pass # Extras don't count as legal deliveries
        
    if st.session_state.current_over_balls == 6:
        st.session_state.completed_overs += 1
        st.session_state.current_over_balls = 0
        
    st.session_state.recent_balls.append({'type': event_type, 'label': label})
    if len(st.session_state.recent_balls) > 12:
        st.session_state.recent_balls.pop(0)

def undo():
    if st.session_state.history:
        last_state = st.session_state.history.pop()
        st.session_state.runs = last_state['runs']
        st.session_state.wickets = last_state['wickets']
        st.session_state.completed_overs = last_state['completed_overs']
        st.session_state.current_over_balls = last_state['current_over_balls']
        st.session_state.recent_balls = last_state['recent_balls']

def reset():
    st.session_state.runs = 0
    st.session_state.wickets = 0
    st.session_state.completed_overs = 0
    st.session_state.current_over_balls = 0
    st.session_state.recent_balls = []
    st.session_state.history = []

# --- UI Layout ---
st.set_page_config(page_title="CricScore", page_icon="🏏", layout="centered")

st.title("🏏 CricScore: Live Cricket Scorer")

col1, col2 = st.columns([3, 1])
with col2:
    st.button("↩️ Undo", on_click=undo, disabled=len(st.session_state.history) == 0, use_container_width=True)
    st.button("🔄 Reset", on_click=reset, use_container_width=True)

st.markdown("---")

# Score Display
st.markdown(f"<h1 style='text-align: center; font-size: 5rem; color: #10b981;'>{st.session_state.runs}<span style='font-size: 3rem; color: #64748b;'>/{st.session_state.wickets}</span></h1>", unsafe_allow_html=True)

total_overs_bowled = st.session_state.completed_overs + (st.session_state.current_over_balls / 6.0)
crr = (st.session_state.runs / total_overs_bowled) if total_overs_bowled > 0 else 0.0

col_o, col_r = st.columns(2)
col_o.metric("Overs", f"{st.session_state.completed_overs}.{st.session_state.current_over_balls}")
col_r.metric("CRR", f"{crr:.2f}")

st.markdown("### Recent Balls")
if not st.session_state.recent_balls:
    st.write("No balls bowled yet.")
else:
    # Display recent balls as a formatted string
    recent_str = " ".join([f"`{b['label']}`" for b in st.session_state.recent_balls])
    st.markdown(f"#### {recent_str}")

st.markdown("---")
st.markdown("### Add Runs")

r1, r2, r3 = st.columns(3)
r1.button("0", on_click=handle_ball, args=('run', 0, '0'), use_container_width=True)
r2.button("1", on_click=handle_ball, args=('run', 1, '1'), use_container_width=True)
r3.button("2", on_click=handle_ball, args=('run', 2, '2'), use_container_width=True)

r4, r5, r6 = st.columns(3)
r4.button("3", on_click=handle_ball, args=('run', 3, '3'), use_container_width=True)
r5.button("4", on_click=handle_ball, args=('run', 4, '4'), use_container_width=True)
r6.button("6", on_click=handle_ball, args=('run', 6, '6'), use_container_width=True)

st.markdown("### Extras & Wickets")
e1, e2, e3 = st.columns(3)
e1.button("Wide", on_click=handle_ball, args=('wide', 1, 'Wd'), use_container_width=True)
e2.button("No Ball", on_click=handle_ball, args=('noball', 1, 'NB'), use_container_width=True)
e3.button("Wicket", on_click=handle_ball, args=('wicket', 0, 'W'), type="primary", use_container_width=True)
