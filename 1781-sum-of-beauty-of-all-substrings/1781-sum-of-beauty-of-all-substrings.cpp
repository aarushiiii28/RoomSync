class Solution {
public:

    int beautySum(string s) {
        
        int sum = 0;
        for(int i = 0; i<s.size(); i++){

            vector <int> freq(26, 0);
            for(int j = i; j<s.size(); j++){
                freq[s[j] - 'a']++;
                int maxi = 0;
                int mini = INT_MAX;

                for (int f : freq) {
                    if (f > 0) {
                        maxi = max(maxi, f);
                        mini = min(mini, f);
                    }
                }

                int beauty = maxi - mini;
                sum+=beauty; 
            }

        }        
        return sum;
    }
};