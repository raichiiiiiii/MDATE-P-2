import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "./AuthProvider";

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const router = useRouter();
  const { confirmPasswordReset } = useAuth();
  const token = typeof params.token === "string" ? params.token : "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null); setMessage(null);
    if (!token) { setError("This password-reset link is missing its token."); return; }
    if (password.length < 12) { setError("Use at least 12 characters and no more than 72 UTF-8 bytes."); return; }
    if (password !== confirm) { setError("The passwords do not match."); return; }
    setBusy(true);
    try {
      await confirmPasswordReset(token, password);
      setMessage("Your password has been updated. You can now sign in.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't reset your password.");
    } finally { setBusy(false); }
  };

  return <View style={styles.page}>
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>Reset your password</Text>
      <Text style={styles.copy}>Choose a new password for your MDATE account.</Text>
      <Text style={styles.label}>New password</Text>
      <TextInput accessibilityLabel="New password" autoCapitalize="none" secureTextEntry value={password} onChangeText={setPassword} style={styles.input} placeholder="At least 12 characters"/>
      <Text style={styles.label}>Confirm password</Text>
      <TextInput accessibilityLabel="Confirm password" autoCapitalize="none" secureTextEntry value={confirm} onChangeText={setConfirm} style={styles.input} placeholder="Enter it again"/>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.success}>{message}</Text> : null}
      <Pressable accessibilityRole="button" disabled={busy || !!message} onPress={() => void submit()} style={styles.button}>{busy ? <ActivityIndicator color="#FFFFFF"/> : <Text style={styles.buttonText}>Update password</Text>}</Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.replace("/(auth)/sign-in")} style={styles.link}><Text style={styles.linkText}>Return to sign in</Text></Pressable>
    </View>
  </View>;
}
const styles = StyleSheet.create({page:{flex:1,justifyContent:"center",padding:24,backgroundColor:"#F4F7FB"},card:{width:"100%",maxWidth:480,alignSelf:"center",backgroundColor:"#FFFFFF",borderRadius:18,padding:22,gap:12,borderWidth:1,borderColor:"#DFE7F0"},title:{fontSize:27,fontWeight:"800",color:"#172B4D"},copy:{fontSize:15,lineHeight:22,color:"#52657A",marginBottom:8},label:{fontSize:15,fontWeight:"700",color:"#243B53"},input:{minHeight:54,borderWidth:1.5,borderColor:"#B8C7D9",borderRadius:11,paddingHorizontal:14,fontSize:16,color:"#172B4D"},error:{color:"#B42318",fontSize:14},success:{color:"#176B45",fontSize:14,lineHeight:21},button:{minHeight:54,backgroundColor:"#174EA6",borderRadius:12,alignItems:"center",justifyContent:"center",marginTop:8},buttonText:{color:"#FFFFFF",fontSize:17,fontWeight:"800"},link:{alignItems:"center",padding:10},linkText:{color:"#174EA6",fontSize:15,fontWeight:"700"}});
