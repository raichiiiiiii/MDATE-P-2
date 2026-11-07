import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../auth/AuthProvider";
import { changeMyPassword, getMySessions, revokeMySession, revokeOtherSessions, type SessionSummary } from "../../profile/services/profileApi";

function readableDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

export default function SecurityScreen() {
  const router = useRouter();
  const { apiRequest, signOut } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const result = await getMySessions(apiRequest);
      setSessions(result.sessions); setCurrentSessionId(result.currentSessionId);
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "We couldn't load your sessions."); }
    finally { setLoading(false); }
  }, [apiRequest]);
  useEffect(() => { void loadSessions(); }, [loadSessions]);

  const submitPassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) { setError("Complete all password fields."); return; }
    if (newPassword !== confirmPassword) { setError("The new passwords do not match."); return; }
    setBusy(true); setError(null); setMessage(null);
    try {
      const result = await changeMyPassword(apiRequest, currentPassword, newPassword);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setMessage(result.message); await loadSessions();
    } catch (passwordError) { setError(passwordError instanceof Error ? passwordError.message : "We couldn't change your password."); }
    finally { setBusy(false); }
  };

  const revoke = async (session: SessionSummary) => {
    setBusy(true); setError(null); setMessage(null);
    try {
      await revokeMySession(apiRequest, session.id);
      if (session.id === currentSessionId) {
        await signOut();
        return;
      }
      setMessage("The selected session has been signed out.");
      await loadSessions();
    } catch (revokeError) { setError(revokeError instanceof Error ? revokeError.message : "We couldn't revoke this session."); }
    finally { setBusy(false); }
  };

  const revokeOthers = async () => {
    setBusy(true); setError(null); setMessage(null);
    try { const result = await revokeOtherSessions(apiRequest); setMessage(result.message); await loadSessions(); }
    catch (revokeError) { setError(revokeError instanceof Error ? revokeError.message : "We couldn't revoke other sessions."); }
    finally { setBusy(false); }
  };

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={22} color="#174EA6"/><Text style={styles.backText}>Back to profile</Text></Pressable>
        <Text style={styles.eyebrow}>ACCOUNT SECURITY</Text>
        <Text accessibilityRole="header" style={styles.title}>Password and devices</Text>
        <Text style={styles.description}>Control your password and the sessions that can access your MDATE account.</Text>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Change password</Text>
          <Text style={styles.label}>Current password</Text>
          <TextInput accessibilityLabel="Current password" editable={!busy} onChangeText={setCurrentPassword} secureTextEntry style={styles.input} value={currentPassword}/>
          <Text style={styles.label}>New password</Text>
          <TextInput accessibilityLabel="New password" editable={!busy} onChangeText={setNewPassword} placeholder="At least 12 characters" secureTextEntry style={styles.input} value={newPassword}/>
          <Text style={styles.label}>Confirm new password</Text>
          <TextInput accessibilityLabel="Confirm new password" editable={!busy} onChangeText={setConfirmPassword} secureTextEntry style={styles.input} value={confirmPassword}/>
          <Text style={styles.helper}>Use at least 12 characters. Passwords are limited to 72 UTF-8 bytes.</Text>
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => void submitPassword()} style={[styles.primaryButton, busy && styles.disabled]}><Text style={styles.primaryButtonText}>Update password</Text></Pressable>
        </View>
        <View style={styles.card}>
          <View style={styles.sessionHeader}><Text style={styles.sectionTitle}>Signed-in sessions</Text><Pressable accessibilityRole="button" onPress={() => void loadSessions()}><Ionicons name="refresh" size={22} color="#174EA6"/></Pressable></View>
          <Text style={styles.helper}>Sessions are grouped by the device's refresh-token family. Device model details are not collected yet.</Text>
          {loading ? <ActivityIndicator color="#174EA6"/> : sessions.length === 0 ? <Text style={styles.helper}>No active sessions were found.</Text> : sessions.map((session) => {
            const isCurrent = session.id === currentSessionId;
            return <View key={session.id} style={styles.session}>
              <View style={styles.sessionCopy}>
                <Text style={styles.sessionTitle}>{isCurrent ? "This device" : "Other session"}</Text>
                <Text style={styles.sessionMeta}>Started: {readableDate(session.createdAt)}</Text>
                <Text style={styles.sessionMeta}>Last refreshed: {readableDate(session.lastActiveAt)}</Text>
                <Text style={styles.sessionMeta}>Expires: {readableDate(session.expiresAt)}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={isCurrent ? "Sign out this device" : "Sign out this session"} disabled={busy} onPress={() => void revoke(session)} style={styles.revokeButton}><Text style={styles.revokeButtonText}>{isCurrent ? "Sign out" : "Revoke"}</Text></Pressable>
            </View>;
          })}
          <Pressable accessibilityRole="button" disabled={busy || sessions.filter((item) => item.id !== currentSessionId).length === 0} onPress={() => void revokeOthers()} style={[styles.secondaryButton, (busy || sessions.filter((item) => item.id !== currentSessionId).length === 0) && styles.disabled]}><Text style={styles.secondaryButtonText}>Sign out all other sessions</Text></Pressable>
        </View>
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page:{flexGrow:1,backgroundColor:"#F8FAFC",padding:20,paddingTop:28,paddingBottom:40},content:{width:"100%",maxWidth:620,alignSelf:"center",gap:13},back:{flexDirection:"row",alignItems:"center",alignSelf:"flex-start",gap:4,minHeight:42},backText:{color:"#174EA6",fontSize:16,fontWeight:"700"},eyebrow:{color:"#174EA6",fontSize:12,fontWeight:"800",letterSpacing:1.3},title:{fontSize:29,lineHeight:38,fontWeight:"800",color:"#172B4D"},description:{fontSize:16,lineHeight:24,color:"#52657A",marginBottom:5},card:{backgroundColor:"#FFFFFF",borderWidth:1,borderColor:"#DFE7F0",borderRadius:17,padding:17,gap:10},sectionTitle:{fontSize:19,lineHeight:26,fontWeight:"800",color:"#172B4D"},label:{fontSize:15,lineHeight:22,fontWeight:"700",color:"#243B53",marginTop:3},input:{minHeight:50,borderWidth:1.5,borderColor:"#B8C7D9",borderRadius:10,paddingHorizontal:12,color:"#172B4D",fontSize:16,backgroundColor:"#FFFFFF"},helper:{fontSize:13,lineHeight:19,color:"#65788D"},primaryButton:{minHeight:48,paddingHorizontal:16,borderRadius:11,backgroundColor:"#174EA6",alignItems:"center",justifyContent:"center",marginTop:4},primaryButtonText:{fontSize:16,fontWeight:"800",color:"#FFFFFF"},sessionHeader:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},session:{borderTopWidth:1,borderTopColor:"#E5EBF2",paddingTop:12,flexDirection:"row",alignItems:"center",gap:12},sessionCopy:{flex:1,gap:3},sessionTitle:{color:"#172B4D",fontSize:16,fontWeight:"800"},sessionMeta:{color:"#65788D",fontSize:12,lineHeight:17},revokeButton:{minHeight:40,paddingHorizontal:12,alignItems:"center",justifyContent:"center",borderWidth:1,borderColor:"#B42318",borderRadius:9},revokeButtonText:{color:"#B42318",fontWeight:"800",fontSize:13},secondaryButton:{minHeight:48,borderRadius:11,borderWidth:1.5,borderColor:"#174EA6",alignItems:"center",justifyContent:"center",marginTop:5},secondaryButtonText:{color:"#174EA6",fontSize:15,fontWeight:"800"},disabled:{opacity:0.55},error:{color:"#B42318",fontSize:15,lineHeight:22},message:{color:"#16734A",fontSize:15,lineHeight:22},
});
