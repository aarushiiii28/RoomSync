def score_room_preference(room_a: str | None, room_b: str | None) -> float:
    """
    Score room preference (private vs shared).
    Exact match -> 1.0
    Mismatch -> 0.5 (soft preference)
    """
    if not room_a or not room_b:
        return 0.5
    if room_a == room_b:
        return 1.0
    return 0.5


def score_move_in_timeframe(timeframe_a: str | None, timeframe_b: str | None) -> float:
    """
    Score move-in timeframe using an ordinal distance.
    'not_sure' is neutral.
    """
    if timeframe_a == "not_sure" or timeframe_b == "not_sure" or not timeframe_a or not timeframe_b:
        return 0.5
        
    order = {
        "within_1_month": 0,
        "one_to_three_months": 1,
        "three_to_six_months": 2,
        "six_to_twelve_months": 3
    }
    
    index_a = order.get(timeframe_a, 0)
    index_b = order.get(timeframe_b, 0)
    
    distance = abs(index_a - index_b)
    scores = {0: 1.0, 1: 0.8, 2: 0.5, 3: 0.2}
    return scores.get(distance, 0.0)


def score_lease_duration(duration_a: str | None, duration_b: str | None) -> float:
    """
    Score lease duration using an ordinal distance.
    'flexible' works well with most durations.
    """
    if duration_a == "flexible" or duration_b == "flexible" or not duration_a or not duration_b:
        return 0.8
        
    order = {
        "1_month": 0,
        "3_months": 1,
        "6_months": 2,
        "1_year_plus": 3
    }
    
    index_a = order.get(duration_a, 0)
    index_b = order.get(duration_b, 0)
    
    distance = abs(index_a - index_b)
    scores = {0: 1.0, 1: 0.8, 2: 0.5, 3: 0.2}
    return scores.get(distance, 0.0)


def evaluate_budget(min_a: float, max_a: float, min_b: float, max_b: float) -> tuple[bool, float]:
    """
    Evaluates monthly budget range overlap.
    Returns (is_viable, overlap_score).
    If there is no overlap, the match is not viable (False).
    """
    highest_min = max(min_a, min_b)
    lowest_max = min(max_a, max_b)
    
    if highest_min > lowest_max:
        return False, 0.0
        
    overlap_width = lowest_max - highest_min
    width_a = max_a - min_a
    width_b = max_b - min_b
    min_width = min(width_a, width_b)
    
    if min_width == 0:
        return True, 1.0
        
    score = min(1.0, float(overlap_width / min_width))
    return True, score
