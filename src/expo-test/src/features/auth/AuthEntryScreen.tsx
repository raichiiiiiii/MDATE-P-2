import { useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from "react-native";
import { useAuth, type AuthMode } from "./AuthProvider";

type Props = { initialMode?: AuthMode };

export default function AuthEntryScreen({ initialMode = "sign-in" }: Props) {
  const { signIn, signUp, requestPasswordReset } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    setError(null); setNotice(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Enter a valid email address."); return;
    }
    if (password.length < 12) { setError("Use a password with at least 12 characters."); return; }
    if (mode === "sign-up" && password !== confirmPassword) {
      setError("The passwords do not match."); return;
    }
    setBusy(true);
    try {
      if (mode === "sign-in") await signIn(normalizedEmail, password);
      else await signUp(normalizedEmail, password);
      setPassword(""); setConfirmPassword("");
    } catch (caught) {
      console.error("MDATE sign-in failed:", caught);
      setError(caught instanceof Error ? caught.message : "We couldn't complete sign-in. Try again.");
    } finally { setBusy(false); }
  };

  const reset = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Enter your email address first."); return;
    }
    setBusy(true); setError(null); setNotice(null);
    try {
      await requestPasswordReset(normalizedEmail);
      setNotice("If an account uses this email, password reset instructions will be sent.");
    } catch (caught) {
      console.error("Password reset request failed:", caught);
      setNotice("We couldn't process the request just now. Please try again later.");
    } finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={styles.main}>
          <View style={styles.brandRow}>
            <View style={styles.mark}><Text style={styles.markText}>M</Text></View>
            <View><Text style={styles.brand}>MDATE</Text><Text style={styles.tagline}>Mobile Digital Aphasia Therapy Environment</Text></View>
          </View>
          <Text accessibilityRole="header" style={styles.heading}>{mode === "sign-in" ? "Welcome back" : "Create your account"}</Text>
          <Text style={styles.intro}>{mode === "sign-in" ? "Sign in to continue your therapy journey." : "Create an account to get started with MDATE."}</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{mode === "sign-in" ? "Your account" : "New account details"}</Text>
            <Text style={styles.label}>Email address</Text>
            <TextInput accessibilityLabel="Email address" autoCapitalize="none" autoComplete="email" autoCorrect={false} editable={!busy} keyboardType="email-address" onChangeText={setEmail} placeholder="name@example.com" placeholderTextColor="#718096" style={styles.input} textContentType="emailAddress" value={email}/>
            <Text style={styles.label}>Password</Text>
            <TextInput accessibilityLabel="Password" autoCapitalize="none" autoComplete={mode === "sign-up" ? "new-password" : "current-password"} editable={!busy} onChangeText={setPassword} placeholder="At least 12 characters" placeholderTextColor="#718096" secureTextEntry={!showPassword} style={styles.input} textContentType={mode === "sign-up" ? "newPassword" : "password"} value={password}/>
            <Pressable accessibilityRole="button" accessibilityLabel={showPassword ? "Hide password" : "Show password"} onPress={() => setShowPassword((v) => !v)} style={styles.textAction}><Text style={styles.actionText}>{showPassword ? "Hide password" : "Show password"}</Text></Pressable>
            {mode === "sign-up" ? <><Text style={styles.label}>Confirm password</Text><TextInput accessibilityLabel="Confirm password" autoCapitalize="none" editable={!busy} onChangeText={setConfirmPassword} placeholder="Enter your password again" placeholderTextColor="#718096" secureTextEntry={!showPassword} style={styles.input} value={confirmPassword}/><Text style={styles.helper}>Your password must contain at least 12 characters and no more than 72 UTF-8 bytes.</Text></> : null}
          </View>
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}
          {mode === "sign-in" ? <Pressable accessibilityRole="button" disabled={busy} onPress={() => void reset()} style={styles.textAction}><Text style={styles.actionText}>Forgot password?</Text></Pressable> : null}
        </View>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy, busy }} disabled={busy} onPress={() => void submit()} style={[styles.primary, busy && styles.disabled]}>{busy ? <ActivityIndicator color="#FFFFFF"/> : <Text style={styles.primaryText}>{mode === "sign-in" ? "Sign in" : "Create account"}</Text>}</Pressable>
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => { setMode((v) => v === "sign-in" ? "sign-up" : "sign-in"); setPassword(""); setConfirmPassword(""); setError(null); setNotice(null); }} style={styles.secondary}><Text style={styles.secondaryText}>{mode === "sign-in" ? "Create an account" : "I already have an account"}</Text></Pressable>
          <Text style={styles.footer}>Your MDATE password is securely hashed by the backend. It is never stored in plain text.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:{flex:1,backgroundColor:"#F4F7FB"},page:{flexGrow:1,minHeight:"100%",justifyContent:"space-between",paddingHorizontal:24,paddingTop:28,paddingBottom:22},main:{width:"100%",maxWidth:480,alignSelf:"center"},brandRow:{flexDirection:"row",alignItems:"center",gap:13,marginBottom:34},mark:{width:54,height:54,borderRadius:17,backgroundColor:"#DCEAFE",alignItems:"center",justifyContent:"center"},markText:{color:"#174EA6",fontSize:29,fontWeight:"800"},brand:{color:"#17365D",fontSize:18,fontWeight:"800",letterSpacing:1.5},tagline:{color:"#5C6F85",fontSize:13,marginTop:3},heading:{color:"#172B4D",fontSize:31,lineHeight:39,fontWeight:"800",marginBottom:8},intro:{color:"#52657A",fontSize:17,lineHeight:26,marginBottom:24},card:{backgroundColor:"#FFFFFF",borderColor:"#DFE7F0",borderWidth:1,borderRadius:20,padding:20,gap:12},cardTitle:{color:"#172B4D",fontSize:19,fontWeight:"800",marginBottom:4},label:{color:"#243B53",fontSize:16,lineHeight:23,fontWeight:"700"},input:{minHeight:56,borderWidth:1.5,borderColor:"#B8C7D9",borderRadius:12,paddingHorizontal:15,backgroundColor:"#FFFFFF",color:"#172B4D",fontSize:17},helper:{color:"#65788D",fontSize:14,lineHeight:21},textAction:{alignSelf:"flex-end",minHeight:38,justifyContent:"center",paddingVertical:6,paddingHorizontal:2},actionText:{color:"#174EA6",fontSize:15,fontWeight:"700"},error:{color:"#B42318",fontSize:15,lineHeight:22,marginTop:14},notice:{color:"#176B45",fontSize:14,lineHeight:21,marginTop:14},actions:{width:"100%",maxWidth:480,alignSelf:"center",gap:12,marginTop:28},primary:{minHeight:58,borderRadius:14,backgroundColor:"#174EA6",alignItems:"center",justifyContent:"center",paddingHorizontal:18},primaryText:{color:"#FFFFFF",fontSize:18,fontWeight:"800"},secondary:{minHeight:58,borderRadius:14,backgroundColor:"#FFFFFF",borderWidth:2,borderColor:"#174EA6",alignItems:"center",justifyContent:"center",paddingHorizontal:18},secondaryText:{color:"#174EA6",fontSize:17,fontWeight:"800"},disabled:{opacity:0.65},footer:{color:"#687B90",fontSize:12,lineHeight:18,textAlign:"center",marginTop:4},
});
