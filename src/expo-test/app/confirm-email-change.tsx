import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../src/features/auth/AuthProvider";

export default function ConfirmEmailChangeRoute() {
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const router = useRouter();
  const { confirmEmailChange } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    if (!token) { setError("The verification link does not contain a token."); return; }
    setBusy(true); setError(null); setMessage(null);
    try { await confirmEmailChange(token); setMessage("Your MDATE email address is now verified and updated. You can return to the app."); }
    catch (confirmError) { setError(confirmError instanceof Error ? confirmError.message : "We couldn't verify this email address."); }
    finally { setBusy(false); }
  };

  return (
    <View style={styles.page}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>MDATE ACCOUNT</Text>
        <Text accessibilityRole="header" style={styles.title}>Verify your new email</Text>
        <Text style={styles.copy}>Confirm that you can receive messages at this address. Your account email will update after verification.</Text>
        {!message ? <Pressable accessibilityRole="button" disabled={busy || !token} onPress={() => void confirm()} style={styles.button}>{busy ? <ActivityIndicator color="#FFFFFF"/> : <Text style={styles.buttonText}>Confirm email address</Text>}</Pressable> : null}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {message ? <Text style={styles.success}>{message}</Text> : null}
        <Pressable accessibilityRole="button" onPress={() => router.replace("/")} style={styles.back}><Text style={styles.backText}>Return to MDATE</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({page:{flex:1,backgroundColor:"#F8FAFC",padding:22,justifyContent:"center"},card:{width:"100%",maxWidth:520,alignSelf:"center",backgroundColor:"#FFFFFF",borderWidth:1,borderColor:"#DFE7F0",borderRadius:18,padding:22,gap:14},eyebrow:{fontSize:12,fontWeight:"800",letterSpacing:1.2,color:"#174EA6"},title:{fontSize:27,lineHeight:35,fontWeight:"800",color:"#172B4D"},copy:{fontSize:16,lineHeight:24,color:"#52657A"},button:{minHeight:52,borderRadius:12,backgroundColor:"#174EA6",alignItems:"center",justifyContent:"center",marginTop:5},buttonText:{fontSize:16,fontWeight:"800",color:"#FFFFFF"},error:{fontSize:14,lineHeight:21,color:"#B42318"},success:{fontSize:15,lineHeight:23,color:"#16734A"},back:{minHeight:42,alignItems:"center",justifyContent:"center"},backText:{fontSize:15,fontWeight:"700",color:"#174EA6"}});
